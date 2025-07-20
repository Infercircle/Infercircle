export interface TwitterUser {
    id: string;
    name: string;
    username: string;
    followersCount: number;
    email: string | undefined;
    image: string;
}
