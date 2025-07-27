export interface User {
    id: string;
    name: string;
    username: string;
    followersCount: number;
    email: string | undefined;
    image: string;
    inviteAccepted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
