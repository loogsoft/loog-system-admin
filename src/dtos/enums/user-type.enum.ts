export const UserTypeEnum = {
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
} as const;

export type UserTypeEnum = (typeof UserTypeEnum)[keyof typeof UserTypeEnum];
