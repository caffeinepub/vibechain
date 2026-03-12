import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Data Types
  type Profile = {
    username : Text;
    bio : Text;
  };

  type Vibe = {
    id : Nat;
    user : Principal;
    mood : Text;
    songTitle : Text;
    artistName : Text;
    message : ?Text;
    timestamp : Time.Time;
  };

  type Circle = {
    name : Text;
    description : Text;
    creator : Principal;
    members : List.List<Principal>;
  };

  type CircleView = {
    name : Text;
    description : Text;
    creator : Principal;
    members : [Principal];
  };

  type MoodSong = {
    id : Nat;
    mood : Text;
    title : Text;
    artist : Text;
    videoId : Text;
    addedBy : Principal;
    timestamp : Time.Time;
  };

  // Comparison module for Vibe to sort by timestamp
  module Vibe {
    public func compare(v1 : Vibe, v2 : Vibe) : Order.Order {
      Int.compare(v2.timestamp, v1.timestamp); // Most recent first
    };
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let profiles = Map.empty<Principal, Profile>();
  var nextVibeId = 0;

  let vibes = Map.empty<Nat, Vibe>();
  let circles = Map.empty<Text, Circle>();

  let moodSongs = Map.empty<Nat, MoodSong>();
  var nextMoodSongId = 0;

  // Auto-register any authenticated (non-anonymous) caller as a user if not already registered
  func ensureRegistered(caller : Principal) {
    if (caller.isAnonymous()) { return };
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {}; // Already registered
      case (null) { accessControlState.userRoles.add(caller, #user) };
    };
  };

  // Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func updateProfile(username : Text, bio : Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    let profile : Profile = {
      username;
      bio;
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerProfile() : async Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  // Vibe Management
  public shared ({ caller }) func postVibe(mood : Text, songTitle : Text, artistName : Text, message : ?Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post vibes");
    };

    let vibe : Vibe = {
      id = nextVibeId;
      user = caller;
      mood;
      songTitle;
      artistName;
      message;
      timestamp = Time.now();
    };

    vibes.add(nextVibeId, vibe);
    nextVibeId += 1;
  };

  public query ({ caller }) func getAllVibes() : async [Vibe] {
    // Public feed - accessible to all including guests
    vibes.values().toArray().sort();
  };

  public query ({ caller }) func getUserVibes(user : Principal) : async [Vibe] {
    // Public view of user vibes - accessible to all including guests
    let userVibes = vibes.values().toArray().filter(
      func(vibe) { vibe.user == user }
    );
    userVibes.sort();
  };

  public shared ({ caller }) func deleteVibe(vibeId : Nat) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete vibes");
    };

    switch (vibes.get(vibeId)) {
      case (null) { Runtime.trap("Vibe not found") };
      case (?vibe) {
        if (vibe.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own vibes");
        };
        vibes.remove(vibeId);
      };
    };
  };

  // Mood Songs (user-added songs visible to all)
  public shared ({ caller }) func addMoodSong(mood : Text, title : Text, artist : Text, videoId : Text) : async Nat {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add songs");
    };

    let song : MoodSong = {
      id = nextMoodSongId;
      mood;
      title;
      artist;
      videoId;
      addedBy = caller;
      timestamp = Time.now();
    };

    moodSongs.add(nextMoodSongId, song);
    let id = nextMoodSongId;
    nextMoodSongId += 1;
    id;
  };

  public query func getMoodSongs(mood : Text) : async [MoodSong] {
    moodSongs.values().toArray().filter(
      func(s) { s.mood == mood }
    );
  };

  public query func getPublicUsername(user : Principal) : async ?Text {
    switch (profiles.get(user)) {
      case (null) { null };
      case (?profile) {
        if (profile.username == "") { null } else { ?profile.username }
      };
    };
  };

  public shared ({ caller }) func deleteMoodSong(songId : Nat) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete songs");
    };

    switch (moodSongs.get(songId)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) {
        if (song.addedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own songs");
        };
        moodSongs.remove(songId);
      };
    };
  };

  // Vibe Circles
  public shared ({ caller }) func createCircle(name : Text, description : Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create circles");
    };

    let circle : Circle = {
      name;
      description;
      creator = caller;
      members = List.empty<Principal>();
    };

    circles.add(name, circle);
  };

  public shared ({ caller }) func joinCircle(circleName : Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join circles");
    };

    switch (circles.get(circleName)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        if (isMember(circle.members, caller)) {
          Runtime.trap("Already a member of this circle");
        };
        let updatedCircle : Circle = {
          name = circle.name;
          description = circle.description;
          creator = circle.creator;
          members = List.singleton(caller);
        };
        circles.add(circleName, updatedCircle);
      };
    };
  };

  public shared ({ caller }) func leaveCircle(circleName : Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave circles");
    };

    switch (circles.get(circleName)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        let filteredMembers = circle.members.filter(
          func(member) { member != caller }
        );
        let updatedCircle : Circle = {
          name = circle.name;
          description = circle.description;
          creator = circle.creator;
          members = filteredMembers;
        };
        circles.add(circleName, updatedCircle);
      };
    };
  };

  // Helper function to check membership
  func isMember(members : List.List<Principal>, user : Principal) : Bool {
    members.values().any(func(member) { member == user });
  };

  // Convert mutable Circle to immutable CircleView
  func toCircleView(circle : Circle) : CircleView {
    {
      name = circle.name;
      description = circle.description;
      creator = circle.creator;
      members = circle.members.toArray();
    };
  };

  public query ({ caller }) func getAllCircles() : async [(Text, CircleView)] {
    circles.toArray().map(
      func((name, circle)) { (name, toCircleView(circle)) }
    );
  };

  public query ({ caller }) func getCircleMembers(circleName : Text) : async [Principal] {
    // Public information - accessible to all including guests
    switch (circles.get(circleName)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) { circle.members.toArray() };
    };
  };

  public shared ({ caller }) func deleteCircle(circleName : Text) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete circles");
    };

    switch (circles.get(circleName)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        if (circle.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the creator can delete this circle");
        };
        circles.remove(circleName);
      };
    };
  };
};
