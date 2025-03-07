import {
  cloneObject,
  Filter,
  IHubSearchOptions,
  _searchGroups,
} from "../../src";
import * as Portal from "@esri/arcgis-rest-portal";
import * as SimpleResponse from "../mocks/portal-groups-search/simple-response.json";
import { MOCK_AUTH } from "../mocks/mock-auth";
import { IModel } from "../../src";

describe("_searchGroups:", () => {
  describe("portal:", () => {
    it("defaults to ago prod", async () => {
      const searchGroupsSpy = spyOn(Portal, "searchGroups").and.callFake(() => {
        return Promise.resolve(cloneObject(SimpleResponse));
      });
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {};
      await _searchGroups(f, o);
      expect(searchGroupsSpy.calls.count()).toBe(1, "should call searchGroups");
      const [expectedParams] = searchGroupsSpy.calls.argsFor(0);
      expect(expectedParams.q).toEqual("water");
      expect(expectedParams.portal).toBe("https://www.arcgis.com/sharing/rest");
    });
    it("search enterprise", async () => {
      const searchGroupsSpy = spyOn(Portal, "searchGroups").and.callFake(() => {
        return Promise.resolve(cloneObject(SimpleResponse));
      });
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {
        api: {
          type: "arcgis",
          url: "https://my-portal.com/gis",
        },
      };
      await _searchGroups(f, o);
      expect(searchGroupsSpy.calls.count()).toBe(1, "should call searchGroups");
      const [expectedParams] = searchGroupsSpy.calls.argsFor(0);
      expect(expectedParams.q).toEqual("water");
      expect(expectedParams.portal).toBe(
        "https://my-portal.com/gis/sharing/rest"
      );
    });

    it("uses specified apis, passes num", async () => {
      const searchGroupsSpy = spyOn(Portal, "searchGroups").and.callFake(() => {
        return Promise.resolve(cloneObject(SimpleResponse));
      });
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {
        api: "arcgisQA",
        num: 6,
      };
      await _searchGroups(f, o);
      expect(searchGroupsSpy.calls.count()).toBe(1, "should call searchGroups");
      const [expectedParams] = searchGroupsSpy.calls.argsFor(0);

      expect(expectedParams.q).toEqual("water");
      expect(expectedParams.num).toEqual(6);
      expect(expectedParams.portal).toBe(
        "https://qaext.arcgis.com/sharing/rest"
      );
    });
    it("passes auth", async () => {
      const searchGroupsSpy = spyOn(Portal, "searchGroups").and.callFake(() => {
        return Promise.resolve(cloneObject(SimpleResponse));
      });
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {
        authentication: MOCK_AUTH,
        site: {
          item: {
            id: "3ef",
          },
        } as unknown as IModel,
      };
      const chk = await _searchGroups(f, o);
      expect(searchGroupsSpy.calls.count()).toBe(1, "should call searchGroups");
      const [expectedParams] = searchGroupsSpy.calls.argsFor(0);
      expect(expectedParams.authentication).toBe(MOCK_AUTH);
      const g1 = chk.results[0];
      expect(g1.id).toBe("7d9cc5e39a8f4c0aa29e04a473bf4703");
      expect(g1.siteTeamUrl).not.toBeDefined();
    });
    it("adds urls", async () => {
      const searchGroupsSpy = spyOn(Portal, "searchGroups").and.callFake(() => {
        return Promise.resolve(cloneObject(SimpleResponse));
      });
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {
        authentication: MOCK_AUTH,
        site: {
          item: {
            url: "https://mysite.com",
          },
        } as unknown as IModel,
      };
      const chk = await _searchGroups(f, o);
      const g1 = chk.results[0];
      expect(g1.id).toBe("7d9cc5e39a8f4c0aa29e04a473bf4703");
      expect(g1.thumbnailUrl).toBeDefined();
      expect(g1.siteTeamUrl).toBe(
        "https://mysite.com/teams/7d9cc5e39a8f4c0aa29e04a473bf4703/about"
      );
    });
  });

  describe("hub api:", () => {
    it("throws if a non-arcgis api is specified", async () => {
      const f: Filter<"group"> = {
        filterType: "group",
        term: "water",
      };
      const o: IHubSearchOptions = {
        api: "hub",
      };
      try {
        await _searchGroups(f, o);
      } catch (ex) {
        expect(ex.message).toBe(
          "_searchGroups is not implemented for non-arcgis apis"
        );
      }
    });
  });
});
