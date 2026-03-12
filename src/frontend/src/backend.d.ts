import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CircleView {
    creator: Principal;
    members: Array<Principal>;
    name: string;
    description: string;
}
export interface Vibe {
    id: bigint;
    songTitle: string;
    mood: string;
    user: Principal;
    message?: string;
    timestamp: Time;
    artistName: string;
}
export type Time = bigint;
export interface Profile {
    bio: string;
    username: string;
}
export interface MoodSong {
    id: bigint;
    title: string;
    mood: string;
    addedBy: Principal;
    timestamp: Time;
    artist: string;
    videoId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMoodSong(mood: string, title: string, artist: string, videoId: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCircle(name: string, description: string): Promise<void>;
    deleteCircle(circleName: string): Promise<void>;
    deleteMoodSong(songId: bigint): Promise<void>;
    deleteVibe(vibeId: bigint): Promise<void>;
    getAllCircles(): Promise<Array<[string, CircleView]>>;
    getAllVibes(): Promise<Array<Vibe>>;
    getCallerProfile(): Promise<Profile>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCircleMembers(circleName: string): Promise<Array<Principal>>;
    getMoodSongs(mood: string): Promise<Array<MoodSong>>;
    getProfile(user: Principal): Promise<Profile | null>;
    getPublicUsername(user: Principal): Promise<string | null>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getUserVibes(user: Principal): Promise<Array<Vibe>>;
    isCallerAdmin(): Promise<boolean>;
    joinCircle(circleName: string): Promise<void>;
    leaveCircle(circleName: string): Promise<void>;
    postVibe(mood: string, songTitle: string, artistName: string, message: string | null): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    updateProfile(username: string, bio: string): Promise<void>;
}
