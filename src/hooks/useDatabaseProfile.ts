import { useEffect, useState } from 'react';

import {
  getActiveDatabaseProfile,
  type DatabaseProfileId,
} from '@/services/database';

export function useDatabaseProfile(): DatabaseProfileId {
  const [profile, setProfile] = useState<DatabaseProfileId>('main');

  useEffect(() => {
    void getActiveDatabaseProfile().then(setProfile);
  }, []);

  return profile;
}
