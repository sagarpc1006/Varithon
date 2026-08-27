export type Language = 'en' | 'mr' | 'hi';

export type ScreenType = 'home' | 'signin';

export type PortalType = 'pilgrim' | 'admin';

export interface UserSession {
  role: PortalType;
  identifier: string;
  name: string;
}
