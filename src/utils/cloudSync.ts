import { SavedUser, GameId } from '../types';

const SYNC_OBJECT_ID = 'ff808181a09d98f701a0e79461242f1c';
const SYNC_API_URL = `https://api.restful-api.dev/objects/${SYNC_OBJECT_ID}`;

export const cloudSync = {
  // Fetch users from cloud relay
  async fetchCloudUsers(): Promise<SavedUser[]> {
    try {
      const res = await fetch(SYNC_API_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const json = await res.json();
      if (json?.data?.usersJson) {
        const parsed = JSON.parse(json.data.usersJson);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (e) {
      console.warn('Cloud sync fetch notice:', e);
      return [];
    }
  },

  // Push users list to cloud relay
  async pushCloudUsers(users: SavedUser[]): Promise<boolean> {
    try {
      const res = await fetch(SYNC_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'gameset_cloud_sync_v1',
          data: {
            usersJson: JSON.stringify(users),
          },
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Cloud sync push notice:', e);
      return false;
    }
  },

  // Merge local users and cloud users
  mergeUsers(localList: SavedUser[], cloudList: SavedUser[]): { merged: SavedUser[]; changed: boolean } {
    const map = new Map<string, SavedUser>();
    let changed = false;

    // Add cloud users first
    cloudList.forEach(u => {
      if (u && u.id && u.displayName) {
        map.set(u.id, u);
      }
    });

    // Merge or update with local users
    localList.forEach(localU => {
      if (!localU || !localU.id) return;
      const existing = map.get(localU.id);
      if (!existing) {
        map.set(localU.id, localU);
        changed = true;
      } else {
        // Merge highScores
        const mergedHighScores = {
          ...(existing.highScores || {}),
          ...(localU.highScores || {}),
        };
        // Take maximum of any shared game
        const allGames: GameId[] = ['nback', 'stroop', 'game2048', 'snake'];
        allGames.forEach(g => {
          const s1 = existing.highScores?.[g] || 0;
          const s2 = localU.highScores?.[g] || 0;
          if (s1 > 0 || s2 > 0) {
            mergedHighScores[g] = Math.max(s1, s2);
          }
        });

        const mergedUser: SavedUser = {
          ...existing,
          ...localU,
          highScores: mergedHighScores,
          lastLoginAt: Math.max(existing.lastLoginAt || 0, localU.lastLoginAt || 0),
        };
        map.set(localU.id, mergedUser);
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));
    return { merged, changed };
  },

  // Perform full 2-way sync
  async sync(localUsers: SavedUser[]): Promise<SavedUser[]> {
    const cloudUsers = await this.fetchCloudUsers();
    if (cloudUsers.length === 0 && localUsers.length > 0) {
      // If cloud was empty, push local
      this.pushCloudUsers(localUsers);
      return localUsers;
    }

    const { merged, changed } = this.mergeUsers(localUsers, cloudUsers);

    // If cloud had new users or local had new users, push back the merged list
    if (changed || merged.length !== cloudUsers.length) {
      this.pushCloudUsers(merged);
    }

    return merged;
  },
};
