import { query } from '../db';
import {
  Tenant,
  Subleasor,
  RoomInfo,
  RoomListItem,
  RoomWithDetails,
  TenantWithAccount,
  TenantFormData,
  RoomFormData,
  TenantFilters,
  RoomFilters,
  Application,
  Contract,
} from '../types';

// Account API
export const accountApi = {
  create: async (data: { name: string; email: string; password: string; bio?: string; dateOfBirth?: string; phoneNumber?: string }) => {
    const sql = `
      INSERT INTO Account (name, email, password, bio, dateOfBirth, phoneNumber)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.name,
      data.email,
      data.password,
      data.bio || null,
      data.dateOfBirth || null,
      data.phoneNumber || null,
    ]);
    return result;
  },

  getByEmail: async (email: string) => {
    const sql = 'SELECT * FROM Account WHERE email = ?';
    const result = await query(sql, [email]) as any[];
    return result[0] || null;
  },

  getById: async (accountID: number) => {
    const sql = 'SELECT * FROM Account WHERE accountID = ?';
    const result = await query(sql, [accountID]) as any[];
    return result[0] || null;
  },

  update: async (accountID: number, data: { name?: string; bio?: string; dateOfBirth?: string; phoneNumber?: string }): Promise<boolean> => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
    if (data.bio !== undefined) { updates.push('bio = ?'); params.push(data.bio || null); }
    if (data.dateOfBirth !== undefined) { updates.push('dateOfBirth = ?'); params.push(data.dateOfBirth || null); }
    if (data.phoneNumber !== undefined) { updates.push('phoneNumber = ?'); params.push(data.phoneNumber || null); }

    if (updates.length === 0) return false;

    params.push(accountID);
    const sql = `UPDATE Account SET ${updates.join(', ')} WHERE accountID = ?`;
    await query(sql, params);
    return true;
  },
};

// Tenant API
export const tenantApi = {
  getAll: async (filters?: TenantFilters): Promise<TenantWithAccount[]> => {
    let sql = `
      SELECT t.*, a.name, a.email, a.bio, a.dateOfBirth, a.phoneNumber
      FROM Tenant t
      INNER JOIN Account a ON t.accountID = a.accountID
      WHERE t.isListed = TRUE
    `;
    const params: any[] = [];

    if (filters?.companyName) {
      sql += ' AND t.companyName LIKE ?';
      params.push(`%${filters.companyName}%`);
    }

    if (filters?.location) {
      sql += ' AND (a.bio LIKE ? OR a.name LIKE ?)';
      params.push(`%${filters.location}%`, `%${filters.location}%`);
    }

    if (filters?.availableFrom) {
      sql += ' AND t.availableFrom <= ?';
      params.push(filters.availableFrom);
    }

    if (filters?.availableTo) {
      sql += ' AND t.availableTo >= ?';
      params.push(filters.availableTo);
    }

    const result = await query(sql, params) as any[];
    return result.map(row => ({
      tenantID: row.tenantID,
      accountID: row.accountID,
      isListed: row.isListed,
      companyName: row.companyName,
      availableFrom: row.availableFrom,
      availableTo: row.availableTo,
      account: {
        accountID: row.accountID,
        name: row.name,
        email: row.email,
        bio: row.bio,
        dateOfBirth: row.dateOfBirth,
        phoneNumber: row.phoneNumber,
        password: '',
      },
    }));
  },

  getById: async (tenantID: number): Promise<TenantWithAccount | null> => {
    const sql = `
      SELECT t.*, a.name, a.email, a.bio, a.dateOfBirth, a.phoneNumber
      FROM Tenant t
      INNER JOIN Account a ON t.accountID = a.accountID
      WHERE t.tenantID = ?
    `;
    const result = await query(sql, [tenantID]) as any[];
    if (!result[0]) return null;

    const row = result[0];
    return {
      tenantID: row.tenantID,
      accountID: row.accountID,
      isListed: row.isListed,
      companyName: row.companyName,
      availableFrom: row.availableFrom,
      availableTo: row.availableTo,
      account: {
        accountID: row.accountID,
        name: row.name,
        email: row.email,
        bio: row.bio,
        dateOfBirth: row.dateOfBirth,
        phoneNumber: row.phoneNumber,
        password: '',
      },
    };
  },

  getByAccountId: async (accountID: number): Promise<TenantWithAccount | null> => {
    const sql = `
      SELECT t.*, a.name, a.email, a.bio, a.dateOfBirth, a.phoneNumber
      FROM Tenant t
      INNER JOIN Account a ON t.accountID = a.accountID
      WHERE t.accountID = ?
    `;
    const result = await query(sql, [accountID]) as any[];
    if (!result[0]) return null;
    const row = result[0];
    return {
      tenantID: row.tenantID,
      accountID: row.accountID,
      isListed: row.isListed,
      companyName: row.companyName,
      availableFrom: row.availableFrom,
      availableTo: row.availableTo,
      account: {
        accountID: row.accountID,
        name: row.name,
        email: row.email,
        bio: row.bio,
        dateOfBirth: row.dateOfBirth,
        phoneNumber: row.phoneNumber,
        password: '',
      },
    };
  },

  create: async (accountID: number, data: { companyName?: string; availableFrom?: string; availableTo?: string }): Promise<Tenant> => {
    const sql = `
      INSERT INTO Tenant (accountID, isListed, companyName, availableFrom, availableTo)
      VALUES (?, TRUE, ?, ?, ?)
    `;
    const result = await query(sql, [
      accountID,
      data.companyName || null,
      data.availableFrom || null,
      data.availableTo || null,
    ]);

    return {
      tenantID: (result as any).insertId,
      accountID,
      isListed: true,
      companyName: data.companyName || null,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      availableTo: data.availableTo ? new Date(data.availableTo) : null,
    };
  },

  update: async (tenantID: number, data: Partial<TenantFormData> & { isListed?: boolean }): Promise<boolean> => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.companyName !== undefined) {
      updates.push('companyName = ?');
      params.push(data.companyName || null);
    }
    if (data.availableFrom !== undefined) {
      updates.push('availableFrom = ?');
      params.push(data.availableFrom || null);
    }
    if (data.availableTo !== undefined) {
      updates.push('availableTo = ?');
      params.push(data.availableTo || null);
    }
    if (data.isListed !== undefined) {
      updates.push('isListed = ?');
      params.push(data.isListed ? 1 : 0);
    }

    if (updates.length === 0) return false;

    params.push(tenantID);
    const sql = `UPDATE Tenant SET ${updates.join(', ')} WHERE tenantID = ?`;
    await query(sql, params);
    return true;
  },

  delete: async (tenantID: number): Promise<boolean> => {
    const sql = 'UPDATE Tenant SET isListed = FALSE WHERE tenantID = ?';
    await query(sql, [tenantID]);
    return true;
  },
};

// Subleasor API
export const subleasorApi = {
  create: async (accountID: number): Promise<Subleasor> => {
    const sql = 'INSERT INTO Subleasor (accountID) VALUES (?)';
    const result = await query(sql, [accountID]);
    return {
      subleasorID: (result as any).insertId,
      accountID,
    };
  },

  getByAccountId: async (accountID: number): Promise<Subleasor | null> => {
    const sql = 'SELECT * FROM Subleasor WHERE accountID = ?';
    const result = await query(sql, [accountID]) as any[];
    return result[0] || null;
  },
};

// Room API
export const roomApi = {
  getAll: async (filters?: RoomFilters): Promise<RoomListItem[]> => {
    let sql = `
      SELECT
        r.roomID,
        r.monthlyRent,
        r.availableFrom,
        r.availableTo,
        r.description,
        p.address,
        p.city,
        p.state,
        p.propertyName,
        a.name as subleasorName,
        a.email as subleasorEmail
      FROM RoomInfo r
      INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
      INNER JOIN Property p ON s.propertyID = p.propertyID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      INNER JOIN Account a ON sub.accountID = a.accountID
      WHERE r.isListed = TRUE
    `;
    const params: any[] = [];

    if (filters?.location) {
      sql += ' AND (p.city LIKE ? OR p.state LIKE ? OR p.address LIKE ?)';
      params.push(`%${filters.location}%`, `%${filters.location}%`, `%${filters.location}%`);
    }

    if (filters?.minPrice !== undefined) {
      sql += ' AND r.monthlyRent >= ?';
      params.push(filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      sql += ' AND r.monthlyRent <= ?';
      params.push(filters.maxPrice);
    }

    if (filters?.availableFrom) {
      sql += ' AND r.availableFrom <= ?';
      params.push(filters.availableFrom);
    }

    if (filters?.availableTo) {
      sql += ' AND r.availableTo >= ?';
      params.push(filters.availableTo);
    }

    if (filters?.propertyType) {
      sql += ' AND p.propertyType = ?';
      params.push(filters.propertyType);
    }

    if (filters?.amenityIDs && filters.amenityIDs.length > 0) {
      sql += ` AND r.roomID IN (
        SELECT ra.roomID FROM RoomAmenity ra
        WHERE ra.amenityID IN (${filters.amenityIDs.map(() => '?').join(',')})
        GROUP BY ra.roomID
        HAVING COUNT(DISTINCT ra.amenityID) = ?
      )`;
      params.push(...filters.amenityIDs, filters.amenityIDs.length);
    }

    const result = await query(sql, params) as any[];

    // Get videos and amenities for each room
    const rooms = await Promise.all(result.map(async (row) => {
      const videos = await query(
        'SELECT * FROM ListingVideo WHERE roomID = ?',
        [row.roomID]
      ) as any[];

      const amenities = await query(`
        SELECT a.* FROM Amenity a
        INNER JOIN RoomAmenity ra ON a.amenityID = ra.amenityID
        WHERE ra.roomID = ?
      `, [row.roomID]) as any[];

      return {
        roomID: row.roomID,
        monthlyRent: parseFloat(row.monthlyRent),
        availableFrom: row.availableFrom,
        availableTo: row.availableTo,
        description: row.description,
        address: row.address,
        city: row.city,
        state: row.state,
        propertyName: row.propertyName,
        subleasorName: row.subleasorName,
        subleasorEmail: row.subleasorEmail,
        videos,
        amenities,
      };
    }));

    return rooms;
  },

  getById: async (roomID: number): Promise<RoomWithDetails | null> => {
    const sql = `
      SELECT
        r.*,
        s.suiteID,
        s.suiteNumber,
        s.floor,
        s.totalRooms,
        s.totalBathrooms,
        s.description as suiteDescription,
        p.propertyID,
        p.propertyName,
        p.propertyType,
        p.address,
        p.city,
        p.state,
        p.yearBuilt,
        p.description as propertyDescription,
        sub.subleasorID,
        sub.accountID as subleasorAccountID,
        a.name as subleasorName,
        a.email as subleasorEmail
      FROM RoomInfo r
      INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
      INNER JOIN Property p ON s.propertyID = p.propertyID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      INNER JOIN Account a ON sub.accountID = a.accountID
      WHERE r.roomID = ?
    `;
    const result = await query(sql, [roomID]) as any[];
    if (!result[0]) return null;

    const row = result[0];

    const videos = await query(
      'SELECT * FROM ListingVideo WHERE roomID = ?',
      [roomID]
    ) as any[];

    const amenities = await query(`
      SELECT a.* FROM Amenity a
      INNER JOIN RoomAmenity ra ON a.amenityID = ra.amenityID
      WHERE ra.roomID = ?
    `, [roomID]) as any[];

    return {
      roomID: row.roomID,
      suiteID: row.suiteID,
      subleasorID: row.subleasorID,
      createdAt: row.createdAt,
      isListed: row.isListed,
      monthlyRent: parseFloat(row.monthlyRent),
      availableFrom: row.availableFrom,
      availableTo: row.availableTo,
      description: row.description,
      suite: {
        suiteID: row.suiteID,
        propertyID: row.propertyID,
        suiteNumber: row.suiteNumber,
        floor: row.floor,
        totalRooms: row.totalRooms,
        totalBathrooms: row.totalBathrooms,
        description: row.suiteDescription,
        property: {
          propertyID: row.propertyID,
          propertyName: row.propertyName,
          propertyType: row.propertyType,
          address: row.address,
          city: row.city,
          state: row.state,
          yearBuilt: row.yearBuilt,
          description: row.propertyDescription,
        },
      },
      subleasor: {
        subleasorID: row.subleasorID,
        accountID: row.subleasorAccountID,
        account: {
          accountID: row.subleasorAccountID,
          name: row.subleasorName,
          email: row.subleasorEmail,
          bio: null,
          dateOfBirth: null,
          phoneNumber: null,
          password: '',
        },
      },
      videos,
      amenities,
    };
  },

  getByAccountId: async (accountID: number): Promise<RoomWithDetails | null> => {
    const sql = `
      SELECT
        r.*,
        s.suiteID,
        s.suiteNumber,
        s.floor,
        s.totalRooms,
        s.totalBathrooms,
        s.description as suiteDescription,
        p.propertyID,
        p.propertyName,
        p.propertyType,
        p.address,
        p.city,
        p.state,
        p.yearBuilt,
        p.description as propertyDescription,
        sub.subleasorID,
        sub.accountID as subleasorAccountID,
        a.name as subleasorName,
        a.email as subleasorEmail
      FROM RoomInfo r
      INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
      INNER JOIN Property p ON s.propertyID = p.propertyID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      INNER JOIN Account a ON sub.accountID = a.accountID
      WHERE sub.accountID = ?
    `;
    const result = await query(sql, [accountID]) as any[];
    if (!result[0]) return null;

    const row = result[0];

    const videos = await query(
      'SELECT * FROM ListingVideo WHERE roomID = ?',
      [row.roomID]
    ) as any[];

    const amenities = await query(`
      SELECT a.* FROM Amenity a
      INNER JOIN RoomAmenity ra ON a.amenityID = ra.amenityID
      WHERE ra.roomID = ?
    `, [row.roomID]) as any[];

    return {
      roomID: row.roomID,
      suiteID: row.suiteID,
      subleasorID: row.subleasorID,
      createdAt: row.createdAt,
      isListed: row.isListed,
      monthlyRent: parseFloat(row.monthlyRent),
      availableFrom: row.availableFrom,
      availableTo: row.availableTo,
      description: row.description,
      suite: {
        suiteID: row.suiteID,
        propertyID: row.propertyID,
        suiteNumber: row.suiteNumber,
        floor: row.floor,
        totalRooms: row.totalRooms,
        totalBathrooms: row.totalBathrooms,
        description: row.suiteDescription,
        property: {
          propertyID: row.propertyID,
          propertyName: row.propertyName,
          propertyType: row.propertyType,
          address: row.address,
          city: row.city,
          state: row.state,
          yearBuilt: row.yearBuilt,
          description: row.propertyDescription,
        },
      },
      subleasor: {
        subleasorID: row.subleasorID,
        accountID: row.subleasorAccountID,
        account: {
          accountID: row.subleasorAccountID,
          name: row.subleasorName,
          email: row.subleasorEmail,
          bio: null,
          dateOfBirth: null,
          phoneNumber: null,
          password: '',
        },
      },
      videos,
      amenities,
    };
  },

  create: async (data: RoomFormData, subleasorAccountID: number): Promise<RoomInfo> => {
    // Create property
    const propertySql = `
      INSERT INTO Property (propertyName, propertyType, address, city, state, yearBuilt, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const propertyResult = await query(propertySql, [
      data.propertyName,
      data.propertyType,
      data.address,
      data.city,
      data.state,
      data.yearBuilt || null,
      data.propertyDescription || null,
    ]);
    const propertyID = (propertyResult as any).insertId;

    // Create suite
    const suiteSql = `
      INSERT INTO SuiteInfo (propertyID, suiteNumber, floor, totalRooms, totalBathrooms, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const suiteResult = await query(suiteSql, [
      propertyID,
      data.suiteNumber || null,
      data.floor || null,
      data.totalRooms || null,
      data.totalBathrooms || null,
      data.suiteDescription || null,
    ]);
    const suiteID = (suiteResult as any).insertId;

    // Get or create subleasor
    let subleasor = await subleasorApi.getByAccountId(subleasorAccountID);
    if (!subleasor) {
      subleasor = await subleasorApi.create(subleasorAccountID);
    }

    // Enforce the UNIQUE constraint up-front so we return a clear error
    // instead of letting MySQL throw a cryptic duplicate-key error
    const existingRoom = await query(
      'SELECT roomID FROM RoomInfo WHERE subleasorID = ?',
      [subleasor.subleasorID]
    ) as any[];
    if (existingRoom.length > 0) {
      throw new Error('DUPLICATE_LISTING');
    }

    // Create room
    const roomSql = `
      INSERT INTO RoomInfo (suiteID, subleasorID, isListed, createdAt, monthlyRent, availableFrom, availableTo, description)
      VALUES (?, ?, TRUE, NOW(), ?, ?, ?, ?)
    `;
    const roomResult = await query(roomSql, [
      suiteID,
      subleasor.subleasorID,
      data.monthlyRent,
      data.availableFrom || null,
      data.availableTo || null,
      data.roomDescription || null,
    ]);
    const roomID = (roomResult as any).insertId;

    // Add amenities
    if (data.amenityIDs && data.amenityIDs.length > 0) {
      for (const amenityID of data.amenityIDs) {
        await query('INSERT INTO RoomAmenity (roomID, amenityID) VALUES (?, ?)', [roomID, amenityID]);
      }
    }

    // Add videos
    if (data.videoUrls && data.videoUrls.length > 0) {
      for (const videoUrl of data.videoUrls) {
        await query('INSERT INTO ListingVideo (roomID, videoUrl) VALUES (?, ?)', [roomID, videoUrl]);
      }
    }

    return {
      roomID,
      suiteID,
      subleasorID: subleasor.subleasorID,
      createdAt: new Date(),
      isListed: true,
      monthlyRent: data.monthlyRent,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      availableTo: data.availableTo ? new Date(data.availableTo) : null,
      description: data.roomDescription || null,
    };
  },

  update: async (roomID: number, data: Partial<RoomFormData>): Promise<boolean> => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.monthlyRent !== undefined) {
      updates.push('monthlyRent = ?');
      params.push(data.monthlyRent);
    }
    if (data.availableFrom !== undefined) {
      updates.push('availableFrom = ?');
      params.push(data.availableFrom);
    }
    if (data.availableTo !== undefined) {
      updates.push('availableTo = ?');
      params.push(data.availableTo);
    }
    if (data.roomDescription !== undefined) {
      updates.push('description = ?');
      params.push(data.roomDescription);
    }

    if (updates.length === 0) return false;

    params.push(roomID);
    const sql = `UPDATE RoomInfo SET ${updates.join(', ')} WHERE roomID = ?`;
    await query(sql, params);
    return true;
  },

  delete: async (roomID: number): Promise<boolean> => {
    const sql = 'UPDATE RoomInfo SET isListed = FALSE WHERE roomID = ?';
    await query(sql, [roomID]);
    return true;
  },
};

// Amenity API
export const amenityApi = {
  getAll: async () => {
    const sql = 'SELECT * FROM Amenity';
    const result = await query(sql) as any[];
    return result;
  },
};

// Application API
export const applicationApi = {
  create: async (tenantID: number, roomID: number, message?: string): Promise<Application> => {
    const sql = `
      INSERT INTO Application (tenantID, roomID, status, message, appliedAt)
      VALUES (?, ?, 'pending', ?, NOW())
    `;
    const result = await query(sql, [tenantID, roomID, message || null]);
    return {
      applicationID: (result as any).insertId,
      tenantID,
      roomID,
      status: 'pending',
      message: message || null,
      appliedAt: new Date(),
    };
  },

  getByRoomId: async (roomID: number): Promise<Application[]> => {
    const sql = 'SELECT * FROM Application WHERE roomID = ?';
    const result = await query(sql, [roomID]) as any[];
    return result;
  },

  getByTenantId: async (tenantID: number): Promise<Application[]> => {
    const sql = 'SELECT * FROM Application WHERE tenantID = ?';
    const result = await query(sql, [tenantID]) as any[];
    return result;
  },

  getByTenantAndRoom: async (tenantID: number, roomID: number) => {
    const sql = 'SELECT applicationID, status FROM Application WHERE tenantID = ? AND roomID = ?';
    const rows = await query(sql, [tenantID, roomID]) as any[];
    return rows[0] || null; // { applicationID, status } or null
  },

  updateStatus: async (applicationID: number, status: 'pending' | 'accepted' | 'rejected'): Promise<boolean> => {
    const sql = 'UPDATE Application SET status = ? WHERE applicationID = ?';
    await query(sql, [status, applicationID]);
    return true;
  },

  delete: async (applicationID: number): Promise<boolean> => {
    await query('DELETE FROM Application WHERE applicationID = ?', [applicationID]);
    return true;
  },

  getByTenantIdWithDetails: async (tenantID: number) => {
    const sql = `
      SELECT
        a.applicationID, a.tenantID, a.roomID, a.status, a.message, a.appliedAt,
        r.monthlyRent, r.availableFrom, r.availableTo,
        p.propertyName, p.address, p.city, p.state
      FROM Application a
      INNER JOIN RoomInfo r ON a.roomID = r.roomID
      INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
      INNER JOIN Property p ON s.propertyID = p.propertyID
      WHERE a.tenantID = ?
      ORDER BY a.appliedAt DESC
    `;
    return await query(sql, [tenantID]) as any[];
  },

  getReceivedByAccountId: async (accountID: number) => {
    const sql = `
      SELECT
        a.applicationID, a.tenantID, a.roomID, a.status, a.message, a.appliedAt,
        r.monthlyRent, r.availableFrom, r.availableTo,
        p.propertyName, p.address, p.city, p.state,
        acc.name  AS applicantName,
        acc.email AS applicantEmail
      FROM Application a
      INNER JOIN RoomInfo r   ON a.roomID     = r.roomID
      INNER JOIN SuiteInfo s  ON r.suiteID    = s.suiteID
      INNER JOIN Property p   ON s.propertyID = p.propertyID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      INNER JOIN Tenant t     ON a.tenantID   = t.tenantID
      INNER JOIN Account acc  ON t.accountID  = acc.accountID
      WHERE sub.accountID = ?
      ORDER BY a.appliedAt DESC
    `;
    return await query(sql, [accountID]) as any[];
  },

  getOwnershipInfo: async (applicationID: number) => {
    const sql = `
      SELECT
        a.applicationID, a.status,
        a.tenantID,
        a.roomID,
        t.accountID   AS tenantAccountID,
        sub.accountID AS subleasorAccountID
      FROM Application a
      INNER JOIN Tenant t      ON a.tenantID    = t.tenantID
      INNER JOIN RoomInfo r    ON a.roomID      = r.roomID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      WHERE a.applicationID = ?
    `;
    const rows = await query(sql, [applicationID]) as any[];
    return rows[0] || null;
  },
};

// Contract API
export const contractApi = {
  create: async (applicationID: number, leaseStart: Date, leaseEnd: Date, monthlyRent: number): Promise<Contract> => {
    const appResult = await query('SELECT * FROM Application WHERE applicationID = ?', [applicationID]) as any[];
    const app = appResult[0];

    const sql = `
      INSERT INTO Contract (applicationID, tenantID, roomID, leaseStart, leaseEnd, monthlyRent, signedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await query(sql, [
      applicationID,
      app.tenantID,
      app.roomID,
      leaseStart,
      leaseEnd,
      monthlyRent,
    ]);

    return {
      contractID: (result as any).insertId,
      applicationID,
      tenantID: app.tenantID,
      roomID: app.roomID,
      leaseStart,
      leaseEnd,
      monthlyRent,
      signedAt: new Date(),
    };
  },

  createFromApplication: async (applicationID: number): Promise<Contract> => {
    const appResult = await query(`
      SELECT a.*, r.availableFrom, r.availableTo, r.monthlyRent
      FROM Application a
      INNER JOIN RoomInfo r ON a.roomID = r.roomID
      WHERE a.applicationID = ?
    `, [applicationID]) as any[];
    const app = appResult[0];
    if (!app) throw new Error('Application not found');

    const sql = `
      INSERT INTO Contract (applicationID, tenantID, roomID, leaseStart, leaseEnd, monthlyRent, signedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await query(sql, [
      applicationID,
      app.tenantID,
      app.roomID,
      app.availableFrom || new Date(),
      app.availableTo || new Date(),
      app.monthlyRent,
    ]);

    return {
      contractID: (result as any).insertId,
      applicationID,
      tenantID: app.tenantID,
      roomID: app.roomID,
      leaseStart: app.availableFrom || new Date(),
      leaseEnd: app.availableTo || new Date(),
      monthlyRent: app.monthlyRent,
      signedAt: new Date(),
    };
  },

  getByTenantId: async (tenantID: number): Promise<Contract[]> => {
    const sql = 'SELECT * FROM Contract WHERE tenantID = ?';
    const result = await query(sql, [tenantID]) as any[];
    return result;
  },

  getByTenantIdWithDetails: async (tenantID: number) => {
    const sql = `
      SELECT
        c.contractID, c.applicationID, c.tenantID, c.roomID,
        c.leaseStart, c.leaseEnd, c.monthlyRent, c.signedAt,
        p.propertyName, p.address, p.city, p.state
      FROM Contract c
      INNER JOIN RoomInfo r ON c.roomID = r.roomID
      INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
      INNER JOIN Property p ON s.propertyID = p.propertyID
      WHERE c.tenantID = ?
      ORDER BY c.signedAt DESC
    `;
    return await query(sql, [tenantID]) as any[];
  },

  getAllForUser: async (accountID: number) => {
    const sql = `
      SELECT
        c.contractID, c.applicationID, c.tenantID, c.roomID,
        c.leaseStart, c.leaseEnd, c.monthlyRent, c.signedAt,
        p.propertyName, p.address, p.city, p.state,
        CASE WHEN t.accountID = ? THEN 'tenant' ELSE 'subleasor' END AS role,
        ta.name        AS tenantName,
        ta.email       AS tenantEmail,
        ta.phoneNumber AS tenantPhone,
        sa.name        AS subleasorName,
        sa.email       AS subleasorEmail,
        sa.phoneNumber AS subleasorPhone
      FROM Contract c
      INNER JOIN RoomInfo r    ON c.roomID      = r.roomID
      INNER JOIN SuiteInfo s   ON r.suiteID     = s.suiteID
      INNER JOIN Property p    ON s.propertyID  = p.propertyID
      INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
      INNER JOIN Tenant t      ON c.tenantID    = t.tenantID
      INNER JOIN Account ta    ON t.accountID   = ta.accountID
      INNER JOIN Account sa    ON sub.accountID = sa.accountID
      WHERE t.accountID = ? OR sub.accountID = ?
      ORDER BY c.signedAt DESC
    `;
    return await query(sql, [accountID, accountID, accountID]) as any[];
  },
};
