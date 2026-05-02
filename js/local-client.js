import {
  clone,
  makeId,
  getLocalDb,
  saveLocalDb,
  getLocalAdminUser,
  getLocalSession,
  setLocalSession,
  clearLocalSession,
  LOCAL_ADMIN_KEY,
} from './local-db.js';

function getRelatedRows(db, relation, row) {
  if (relation === 'cake_images') {
    return (db.cake_images || []).filter((item) => item.cake_id === row.id);
  }
  if (relation === 'cake_variants') {
    return (db.cake_variants || []).filter((item) => item.cake_id === row.id);
  }
  if (relation === 'order_items') {
    return (db.order_items || []).filter((item) => item.order_id === row.id);
  }
  return [];
}

function parseSelectedRelations(selection = '') {
  const names = [];
  const regex = /([a-z_]+)\s*\(/gi;
  let match;
  while ((match = regex.exec(selection))) {
    names.push(match[1]);
  }
  return names;
}

function applySelectProjection(rows, table, selection) {
  const db = getLocalDb();
  const includeAll = !selection || selection.includes('*');
  const relations = parseSelectedRelations(selection);

  return rows.map((row) => {
    const projected = includeAll ? { ...row } : {};
    relations.forEach((relation) => {
      projected[relation] = getRelatedRows(db, relation, row);
    });
    if (!includeAll && !relations.length) {
      selection.split(',').map((part) => part.trim()).filter(Boolean).forEach((field) => {
        if (!field.includes('(')) projected[field] = row[field];
      });
    }
    return projected;
  });
}

function getComparator(field, ascending = true) {
  return (a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return ascending ? 1 : -1;
    if (bv == null) return ascending ? -1 : 1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return ascending ? av - bv : bv - av;
    }
    return ascending
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  };
}

function applyOrFilter(rows, expr) {
  const parts = expr.split(',').map((part) => part.trim()).filter(Boolean);
  return rows.filter((row) =>
    parts.some((part) => {
      const match = part.match(/^([a-z_]+)\.ilike\.%(.*)%$/i);
      if (!match) return false;
      const [, field, search] = match;
      return String(row[field] || '').toLowerCase().includes(search.toLowerCase());
    })
  );
}

function looselyEqual(a, b) {
  return a == b;
}

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this.operation = 'select';
    this.selectString = '*';
    this.selectOptions = {};
    this.filters = [];
    this.sorts = [];
    this.limitValue = null;
    this.rangeValue = null;
    this.shouldSingle = false;
    this.payload = null;
    this.onConflictKey = null;
    this.orFilters = [];
  }

  select(selection = '*', options = {}) {
    this.selectString = selection;
    this.selectOptions = options;
    if (!['insert', 'update', 'upsert', 'delete'].includes(this.operation)) {
      this.operation = 'select';
    }
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload, options = {}) {
    this.operation = 'upsert';
    this.payload = Array.isArray(payload) ? payload : [payload];
    this.onConflictKey = options.onConflict || null;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field, value) {
    this.filters.push((row) => looselyEqual(row[field], value));
    return this;
  }

  neq(field, value) {
    this.filters.push((row) => !looselyEqual(row[field], value));
    return this;
  }

  gte(field, value) {
    this.filters.push((row) => row[field] >= value);
    return this;
  }

  lte(field, value) {
    this.filters.push((row) => row[field] <= value);
    return this;
  }

  not(field, operator, value) {
    if (operator === 'eq') {
      this.filters.push((row) => row[field] !== value);
    }
    return this;
  }

  or(expr) {
    this.orFilters.push(expr);
    return this;
  }

  order(field, options = {}) {
    this.sorts.push({ field, ascending: options.ascending !== false });
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  range(from, to) {
    this.rangeValue = { from, to };
    return this;
  }

  single() {
    this.shouldSingle = true;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const db = getLocalDb();
    const rows = clone(db[this.table] || []);

    if (this.operation === 'insert') {
      const inserted = this.payload.map((item, index) => ({
        id: item.id || makeId(this.table.slice(0, 3) || 'row'),
        created_at: item.created_at || new Date().toISOString(),
        display_order: item.display_order ?? index,
        ...item,
      }));
      db[this.table] = [...rows, ...inserted];
      saveLocalDb(db);
      return this._formatMutationResult(inserted);
    }

    const filtered = this._filterRows(rows);

    if (this.operation === 'update') {
      const updated = [];
      db[this.table] = (db[this.table] || []).map((row) => {
        if (!filtered.find((item) => item.id === row.id)) return row;
        const next = { ...row, ...this.payload };
        updated.push(next);
        return next;
      });
      saveLocalDb(db);
      return this._formatMutationResult(updated);
    }

    if (this.operation === 'delete') {
      const ids = new Set(filtered.map((row) => row.id));
      db[this.table] = (db[this.table] || []).filter((row) => !ids.has(row.id));
      saveLocalDb(db);
      return { data: filtered, error: null, count: filtered.length };
    }

    if (this.operation === 'upsert') {
      const nextRows = [...rows];
      const upserted = [];

      this.payload.forEach((item) => {
        const existingIndex = this.onConflictKey
          ? nextRows.findIndex((row) => row[this.onConflictKey] === item[this.onConflictKey])
          : nextRows.findIndex((row) => row.id === item.id);

        if (existingIndex >= 0) {
          nextRows[existingIndex] = {
            ...nextRows[existingIndex],
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          };
          upserted.push(nextRows[existingIndex]);
        } else {
          const inserted = {
            id: item.id || makeId(this.table.slice(0, 3) || 'row'),
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          };
          nextRows.push(inserted);
          upserted.push(inserted);
        }
      });

      db[this.table] = nextRows;
      saveLocalDb(db);
      return this._formatMutationResult(upserted);
    }

    let resultRows = filtered;

    this.sorts.forEach(({ field, ascending }) => {
      resultRows.sort(getComparator(field, ascending));
    });

    const count = resultRows.length;

    if (this.rangeValue) {
      resultRows = resultRows.slice(this.rangeValue.from, this.rangeValue.to + 1);
    }
    if (this.limitValue != null) {
      resultRows = resultRows.slice(0, this.limitValue);
    }

    if (this.selectOptions.head) {
      return { data: null, error: null, count };
    }

    const projected = applySelectProjection(resultRows, this.table, this.selectString);

    if (this.shouldSingle) {
      return {
        data: projected[0] || null,
        error: projected[0] ? null : { message: 'No rows found' },
        count,
      };
    }

    return { data: projected, error: null, count };
  }

  _filterRows(rows) {
    let result = rows.filter((row) => this.filters.every((filter) => filter(row)));
    this.orFilters.forEach((expr) => {
      result = applyOrFilter(result, expr);
    });
    return result;
  }

  _formatMutationResult(rows) {
    if (this.shouldSingle) {
      return { data: rows[0] || null, error: null, count: rows.length };
    }
    if (this.selectString && this.selectString !== '*') {
      return {
        data: applySelectProjection(rows, this.table, this.selectString),
        error: null,
        count: rows.length,
      };
    }
    return { data: rows, error: null, count: rows.length };
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createLocalClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }) {
        const user = getLocalAdminUser();
        if (email === user.email && password === user.password) {
          const session = {
            access_token: 'local-dev-session',
            user: { email: user.email, id: 'local-admin-user' },
          };
          setLocalSession(session);
          return { data: { session }, error: null };
        }
        return { data: { session: null }, error: { message: 'Invalid login credentials' } };
      },
      async signOut() {
        clearLocalSession();
        return { error: null };
      },
      async getSession() {
        return { data: { session: getLocalSession() }, error: null };
      },
      async updateUser({ password }) {
        const user = getLocalAdminUser();
        const updated = { ...user, password };
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(updated));
        return { data: { user: { email: updated.email } }, error: null };
      },
    },
    from(table) {
      return new LocalQueryBuilder(table);
    },
    async rpc(name) {
      if (name === 'generate_order_number') {
        const db = getLocalDb();
        const year = new Date().getFullYear();
        const serial = String((db.orders || []).length + 1).padStart(4, '0');
        return { data: `AOV-${year}-${serial}`, error: null };
      }
      return { data: null, error: { message: `Unknown RPC: ${name}` } };
    },
    storage: {
      from() {
        return {
          async upload(path, file) {
            const publicUrl = await fileToDataUrl(file);
            return { data: { path, publicUrl }, error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: path } };
          },
          async remove() {
            return { data: [], error: null };
          },
        };
      },
    },
  };
}
