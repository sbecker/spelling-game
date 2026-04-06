import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    parentId: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
      parentId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    parentId: string | null;
  }
}
