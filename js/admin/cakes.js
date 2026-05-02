import { supabaseClient, uploadCakeImage as uploadImg, deleteCakeImage } from '../config.js';
import { initAdminLayout } from './layout.js';
import { formatCurrency, slugify, toast, setButtonLoading, hidePageLoader } from '../utils.js';

let allCakes = [];
let editingId = null;
let pendingImages = [];
let existingImages = [];
let removedExistingImages = [];

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  const session = await initAdminLayout('./cakes.html');
  if (!session) return;

  await loadCakes();
  bindEvents();
});

function bindEvents() {
  let debounce;
  document.getElementById('cake-search')?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(renderTable, 300);
  });

  ['filter-cat', 'filter-avail'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderTable);
  });

  document.getElementById('add-cake-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('cake-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('cake-cancel-btn')?.addEventListener('click', closeModal);
  document.getElementById('cake-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'cake-modal') closeModal();
  });

  document.getElementById('f-name')?.addEventListener('input', () => {
    const slugEl = document.getElementById('f-slug');
    if (!editingId) slugEl.value = slugify(document.getElementById('f-name').value);
  });

  document.getElementById('add-variant-btn')?.addEventListener('click', () => addVariantRow());

  const zone = document.getElementById('image-drop-zone');
  const input = document.getElementById('image-file-input');
  zone?.addEventListener('click', () => input.click());
  zone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('dragover');
  });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone?.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(event.dataTransfer.files);
  });
  input?.addEventListener('change', () => handleFiles(input.files));

  document.getElementById('cake-form')?.addEventListener('submit', saveCake);
}

async function loadCakes() {
  try {
    const { data, error } = await supabaseClient
      .from('cakes')
      .select('*,cake_images(id,public_url,storage_path,is_primary,display_order),cake_variants(id)')
      .order('display_order');

    if (error) throw error;
    allCakes = data || [];
    renderTable();
  } catch (error) {
    console.error(error);
    toast.error(`Failed to load cakes. ${error.message || ''}`);
  }
}

function renderTable() {
  const search = document.getElementById('cake-search')?.value.toLowerCase() || '';
  const category = document.getElementById('filter-cat')?.value;
  const availability = document.getElementById('filter-avail')?.value;
  const filtered = allCakes.filter((cake) =>
    (!search || cake.name.toLowerCase().includes(search)) &&
    (!category || cake.category === category) &&
    (!availability || String(cake.is_available) === availability)
  );

  const tbody = document.getElementById('cakes-body');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty"><i class="fas fa-cake-candles"></i><br/>No cakes found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((cake) => {
    const image = cake.cake_images?.find((item) => item.is_primary) || cake.cake_images?.[0];
    return `
      <tr>
        <td data-label="Image"><div style="width:52px;height:52px;border-radius:var(--radius-md);overflow:hidden;background:var(--clr-stone-100)">
          ${image ? `<img src="${image.public_url}" style="width:100%;height:100%;object-fit:cover" loading="lazy" />` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--clr-stone-300)"><i class="fas fa-image"></i></div>'}
        </div></td>
        <td data-label="Name" data-priority="primary"><strong>${cake.name}</strong><br/><span style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${cake.slug || ''}</span></td>
        <td data-label="Category" style="text-transform:capitalize">${cake.category}</td>
        <td data-label="Base Price">${formatCurrency(cake.base_price)}</td>
        <td data-label="Variants">${cake.cake_variants?.length || 0}</td>
        <td data-label="Featured">${cake.is_featured ? '<i class="fas fa-star" style="color:var(--clr-gold)"></i>' : '—'}</td>
        <td data-label="Status">${cake.is_available ? '<span class="badge badge--confirmed">Active</span>' : '<span class="badge badge--cancelled">Hidden</span>'}</td>
        <td data-label="Actions">
          <div class="table-actions">
            <button class="action-btn action-btn--edit" data-edit-cake="${cake.id}" title="Edit"><i class="fas fa-pen"></i></button>
            <a href="../cake.html?slug=${cake.slug}" target="_blank" class="action-btn action-btn--view" title="Preview"><i class="fas fa-eye"></i></a>
            <button class="action-btn action-btn--delete" data-delete-cake="${cake.id}" data-delete-name="${cake.name}" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-edit-cake]').forEach((button) => {
    button.addEventListener('click', () => editCake(button.dataset.editCake));
  });

  tbody.querySelectorAll('[data-delete-cake]').forEach((button) => {
    button.addEventListener('click', () => deleteCake(button.dataset.deleteCake, button.dataset.deleteName));
  });
}

function openModal(cake) {
  editingId = cake?.id || null;
  pendingImages = [];
  existingImages = [];
  removedExistingImages = [];

  document.getElementById('cake-modal-title').textContent = cake ? 'Edit Cake' : 'Add New Cake';
  document.getElementById('cake-id').value = cake?.id || '';
  document.getElementById('f-name').value = cake?.name || '';
  document.getElementById('f-slug').value = cake?.slug || '';
  document.getElementById('f-category').value = cake?.category || 'birthday';
  document.getElementById('f-base-price').value = cake?.base_price || '';
  document.getElementById('f-min-days').value = cake?.min_order_days || 3;
  document.getElementById('f-description').value = cake?.description || '';
  document.getElementById('f-available').checked = cake?.is_available ?? true;
  document.getElementById('f-featured').checked = cake?.is_featured ?? false;
  document.getElementById('f-allows-custom').checked = cake?.allows_custom ?? false;

  if (cake?.cake_images?.length) {
    existingImages = cake.cake_images.map((image, index) => ({
      ...image,
      isExisting: true,
      isPrimary: image.is_primary || index === 0,
    }));
    renderImagePreviews();
  } else {
    document.getElementById('image-preview-grid').innerHTML = '';
  }

  const variantsList = document.getElementById('variants-list');
  variantsList.innerHTML = '';
  if (cake?.cake_variants?.length) {
    cake.cake_variants.forEach((variant) => addVariantRow(variant));
  } else {
    addVariantRow();
  }

  document.getElementById('cake-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('cake-modal').classList.remove('active');
  editingId = null;
  pendingImages = [];
  existingImages = [];
  removedExistingImages = [];
}

function addVariantRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'variant-row';
  row.dataset.variantId = data.id || '';
  row.innerHTML = `
    <input class="form-input v-flavor" placeholder="Chocolate Fudge" value="${data.flavor || ''}" style="font-size:var(--fz-sm)" />
    <input class="form-input v-size" placeholder="6 inch (serves 8)" value="${data.size || ''}" style="font-size:var(--fz-sm)" />
    <input class="form-input v-price" type="number" placeholder="1200" value="${data.price || ''}" style="font-size:var(--fz-sm)" />
    <input class="form-input v-serves" type="number" placeholder="8" value="${data.serves || ''}" style="font-size:var(--fz-sm)" />
    <button type="button" class="action-btn action-btn--delete" title="Remove"><i class="fas fa-xmark"></i></button>
  `;

  row.querySelector('.action-btn--delete')?.addEventListener('click', () => row.remove());
  document.getElementById('variants-list').appendChild(row);
}

function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(`${file.name} is too large (max 5MB).`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    pendingImages.push({
      file,
      previewUrl,
      isPrimary: pendingImages.length === 0 && existingImages.length === 0,
    });
    renderImagePreviews();
  });

  document.getElementById('image-file-input').value = '';
}

function renderImagePreviews() {
  const grid = document.getElementById('image-preview-grid');
  const allImages = [...existingImages, ...pendingImages];

  grid.innerHTML = allImages.map((image, index) => `
    <div class="image-preview-item ${image.isPrimary ? 'primary' : ''}" data-image-idx="${index}">
      <img src="${image.previewUrl || image.public_url}" alt="Preview" />
      <div class="image-preview-actions">
        <button type="button" class="action-btn" data-primary-image="${index}" style="background:rgba(255,255,255,0.9);color:var(--clr-espresso)" title="Set as primary"><i class="fas fa-star"></i></button>
        <button type="button" class="action-btn" data-remove-image="${index}" style="background:rgba(181,58,42,0.85);color:#fff" title="Remove"><i class="fas fa-xmark"></i></button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-primary-image]').forEach((button) => {
    button.addEventListener('click', () => setPrimary(Number(button.dataset.primaryImage)));
  });

  grid.querySelectorAll('[data-remove-image]').forEach((button) => {
    button.addEventListener('click', () => removeImage(Number(button.dataset.removeImage)));
  });
}

function setPrimary(index) {
  const allImages = [...existingImages, ...pendingImages];
  allImages.forEach((image, idx) => {
    image.isPrimary = idx === index;
  });
  existingImages = allImages.filter((image) => image.isExisting);
  pendingImages = allImages.filter((image) => !image.isExisting);
  renderImagePreviews();
}

function removeImage(index) {
  const allImages = [...existingImages, ...pendingImages];
  const [removed] = allImages.splice(index, 1);
  if (removed?.isExisting) {
    removedExistingImages.push(removed);
  }
  if (allImages.length && !allImages.some((image) => image.isPrimary)) {
    allImages[0].isPrimary = true;
  }
  existingImages = allImages.filter((image) => image.isExisting);
  pendingImages = allImages.filter((image) => !image.isExisting);
  renderImagePreviews();
}

async function saveCake(event) {
  event.preventDefault();
  const button = document.getElementById('cake-save-btn');
  const name = document.getElementById('f-name').value.trim();
  if (!name) {
    toast.warning('Cake name is required.');
    return;
  }

  setButtonLoading(button, true, 'Saving…');

  try {
    const slug = document.getElementById('f-slug').value.trim() || slugify(name);
    const cakePayload = {
      name,
      slug,
      category: document.getElementById('f-category').value,
      base_price: parseFloat(document.getElementById('f-base-price').value) || 0,
      min_order_days: parseInt(document.getElementById('f-min-days').value, 10) || 3,
      description: document.getElementById('f-description').value.trim() || null,
      is_available: document.getElementById('f-available').checked,
      is_featured: document.getElementById('f-featured').checked,
      allows_custom: document.getElementById('f-allows-custom').checked,
    };

    let cakeId = editingId;
    if (editingId) {
      const { error } = await supabaseClient.from('cakes').update(cakePayload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseClient.from('cakes').insert(cakePayload).select().single();
      if (error) throw error;
      cakeId = data.id;
    }

    const orderedImages = [...existingImages, ...pendingImages];

    for (const image of removedExistingImages) {
      const { error: imageDeleteError } = await supabaseClient.from('cake_images').delete().eq('id', image.id);
      if (imageDeleteError) throw imageDeleteError;
      if (image.storage_path) {
        const { error: storageDeleteError } = await deleteCakeImage(image.storage_path);
        if (storageDeleteError) throw storageDeleteError;
      }
    }

    for (let i = 0; i < pendingImages.length; i += 1) {
      const image = pendingImages[i];
      const path = `cakes/${slug}/${Date.now()}-${i}.${image.file.name.split('.').pop()}`;
      const { url, error } = await uploadImg(image.file, path);
      if (error) throw new Error(error);
      if (!url) continue;

      const displayOrder = orderedImages.findIndex((item) => item === image);
      const { error: insertImageError } = await supabaseClient.from('cake_images').insert({
        cake_id: cakeId,
        storage_path: path,
        public_url: url,
        is_primary: image.isPrimary,
        display_order: displayOrder < 0 ? i : displayOrder,
      });
      if (insertImageError) throw insertImageError;
    }

    for (const [index, image] of existingImages.entries()) {
      const { error: updateImageError } = await supabaseClient
        .from('cake_images')
        .update({ is_primary: image.isPrimary, display_order: index })
        .eq('id', image.id);
      if (updateImageError) throw updateImageError;
    }

    const rows = document.querySelectorAll('#variants-list .variant-row');
    const variantPayloads = [];
    rows.forEach((row) => {
      const flavor = row.querySelector('.v-flavor')?.value.trim();
      const size = row.querySelector('.v-size')?.value.trim();
      const price = parseFloat(row.querySelector('.v-price')?.value) || 0;
      const serves = parseInt(row.querySelector('.v-serves')?.value, 10) || null;

      if (flavor && size && price > 0) {
        variantPayloads.push({ cake_id: cakeId, flavor, size, price, serves, is_available: true });
      }
    });

    if (editingId) {
      const { error: deleteVariantsError } = await supabaseClient.from('cake_variants').delete().eq('cake_id', editingId);
      if (deleteVariantsError) throw deleteVariantsError;
    }
    if (variantPayloads.length) {
      const { error: insertVariantsError } = await supabaseClient.from('cake_variants').insert(variantPayloads);
      if (insertVariantsError) throw insertVariantsError;
    }

    toast.success(`${name} saved successfully!`);
    closeModal();
    await loadCakes();
  } catch (error) {
    console.error(error);
    toast.error(`Failed to save cake. ${error.message || ''}`);
  } finally {
    setButtonLoading(button, false);
  }
}

async function editCake(id) {
  try {
    const { data, error } = await supabaseClient.from('cakes').select('*,cake_images(*),cake_variants(*)').eq('id', id).single();
    if (error) throw error;
    if (data) openModal(data);
  } catch (error) {
    console.error(error);
    toast.error(`Failed to load cake details. ${error.message || ''}`);
  }
}

async function deleteCake(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const { data: cakeData, error: fetchError } = await supabaseClient
      .from('cakes')
      .select('id,cake_images(id,storage_path)')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    for (const image of cakeData?.cake_images || []) {
      if (image.storage_path) {
        const { error: storageDeleteError } = await deleteCakeImage(image.storage_path);
        if (storageDeleteError) throw storageDeleteError;
      }
    }

    const { error: deleteImagesError } = await supabaseClient.from('cake_images').delete().eq('cake_id', id);
    if (deleteImagesError) throw deleteImagesError;

    const { error: deleteVariantsError } = await supabaseClient.from('cake_variants').delete().eq('cake_id', id);
    if (deleteVariantsError) throw deleteVariantsError;

    const { error: deleteCakeError } = await supabaseClient.from('cakes').delete().eq('id', id);
    if (deleteCakeError) throw deleteCakeError;

    toast.success(`"${name}" deleted.`);
    await loadCakes();
  } catch (error) {
    console.error(error);
    toast.error(`Delete failed. ${error.message || ''}`);
  }
}
