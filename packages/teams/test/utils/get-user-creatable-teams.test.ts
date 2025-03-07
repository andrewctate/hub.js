import { getUserCreatableTeams } from "../../src/utils/get-user-creatable-teams";

describe("getUserCreatableTeams", () => {
  it("respects product and privs for 9.1", () => {
    const user = {
      privileges: [
        "portal:user:createGroup",
        "portal:admin:updateGroups",
        "portal:admin:createUpdateCapableGroup",
        "portal:admin:",
        "portal:user:addExternalMembersToGroup",
      ],
    };

    expect(
      getUserCreatableTeams(user, "premium", "9.1", "In House").length
    ).toBe(6, "Premium, all privs, should be 6 creatable team types");

    expect(getUserCreatableTeams(user, "basic", "9.1", "In House").length).toBe(
      3,
      "Basic, all privs, should be 3 creatable team types"
    );

    expect(
      getUserCreatableTeams(user, "portal", "9.1", "In House").length
    ).toBe(4, "Portal, all privs, should be 4 creatable team types");

    // remove updateGroups...
    user.privileges = [
      "portal:user:createGroup",
      "opendata:user:designateGroup",
      "portal:user:addExternalMembersToGroup",
    ];

    expect(
      getUserCreatableTeams(user, "premium", "9.1", "In House").length
    ).toBe(5, "Premium, all privs, should be 5 creatable team types");

    expect(getUserCreatableTeams(user, "premium", "9.1").length).toBe(
      2,
      "Premium, all privs, when not passing in a subscription type"
    );

    expect(getUserCreatableTeams(user, "basic", "9.1", "In House").length).toBe(
      2,
      "Basic, all privs, should be 2 creatable team types"
    );

    expect(getUserCreatableTeams(user, "basic", "9.1").length).toBe(
      2,
      "Basic, all privs, when not passing in a sub type"
    );

    expect(
      getUserCreatableTeams(user, "portal", "9.1", "In House").length
    ).toBe(3, "Portal, all privs, should be 3 creatable team types");

    // clear all privs and we should not get any groups back...
    user.privileges = [];

    expect(
      getUserCreatableTeams(user, "premium", "9.1", "In House").length
    ).toBe(0, "no groups should be created if user lacks all privs");

    expect(getUserCreatableTeams(user, "basic", "9.1", "In House").length).toBe(
      0,
      "no groups should be created if user lacks all privs"
    );

    expect(
      getUserCreatableTeams(user, "portal", "9.1", "In House").length
    ).toBe(0, "no groups should be created if user lacks all privs");
  });
  it("properly updates membershipAccess... when warranted", () => {
    const user = {
      privileges: [
        "portal:user:createGroup",
        "portal:admin:updateGroups",
        "portal:admin:createUpdateCapableGroup",
        "portal:admin:",
        "portal:user:addExternalMembersToGroup",
      ],
    };
    const teams = getUserCreatableTeams(user, "premium", "9.1", "In House");
    expect(teams[0].membershipAccess).toBe(
      "collaboration",
      "membershipAccess should be updated to collaboration"
    );
  });
});
