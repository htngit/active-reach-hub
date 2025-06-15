
export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface UserCache {
  [userId: string]: UserData;
}
