import * as fetchMock from "fetch-mock";
import {
  DatasetResource,
  parseDatasetId,
  getContentFromHub,
} from "../src/index";
import { IHubRequestOptions, IHubContent } from "@esri/hub-common";
import * as featureLayerJson from "./mocks/datasets/feature-layer.json";
import * as itemJson from "./mocks/items/map-service.json";
import { mockUserSession } from "./test-helpers/fake-user-session";

function validateContentFromDataset(
  content: IHubContent,
  dataset: DatasetResource,
  expectedFamily: string
) {
  const { id, attributes } = dataset;
  // should have copied these attributes directly
  const itemProperties = [
    "owner",
    "orgId",
    "created",
    "modified",
    // NOTE: name is handled below
    "type",
    "typeKeywords",
    "description",
    "snippet",
    "tags",
    "thumbnail",
    "categories",
    "licenseInfo",
    "culture",
    "url",
    "access",
    "size",
    "commentsEnabled",
    // TODO: what about the others that will be undefined?
  ];
  // should have set item properties
  itemProperties.forEach((key) => {
    expect(content[key]).toEqual(attributes[key]);
  });
  // we use attributes.name for both name and title
  expect(content.title).toBe(attributes.name);
  expect(content.name).toBe(attributes.name);
  // should include derived properties
  expect(content.hubId).toBe(id);
  const extent = attributes.extent;
  expect(content.extent).toEqual(extent && extent.coordinates);
  expect(content.family).toBe(expectedFamily);
  expect(content.summary).toBe(
    attributes.searchDescription || attributes.snippet
  );
  expect(content.publisher).toEqual({
    name: attributes.owner,
    username: attributes.owner,
  });
  expect(content.permissions.visibility).toBe(attributes.access);
  // no itemControl returned w/ this item, expect default
  expect(content.permissions.control).toBe("view");
  // NOTE: we could lazily fetch the item to get properties
  // based on the fact that these are undefined (instead of null)
  expect(content.actionLinks).toBeUndefined();
  expect(content.hubActions).toBeUndefined();
  expect(content.metrics).toBeUndefined();
  expect(content.orgId).toBe(attributes.orgId);
  expect(content.boundary).toEqual(attributes.boundary);
  expect(content.groupIds).toEqual(attributes.groupIds);
  // we force undefined to null in order to not fetch metadata
  expect(content.metadata).toEqual(
    attributes.metadata === undefined ? null : attributes.metadata
  );
  expect(content.license.name).toEqual("Custom License");
  const createdDate = new Date(attributes.created);
  expect(content.createdDate).toEqual(createdDate);
  expect(content.createdDateSource).toEqual("item.created");
  expect(content.publishedDate).toEqual(createdDate);
  expect(content.publishedDateSource).toEqual("item.created");
  expect(content.updatedDate).toEqual(new Date(attributes.modified));
  expect(content.updatedDateSource).toEqual("item.modified");
  expect(typeof content.thumbnailUrl).toBe("string");
}

describe("hub", () => {
  describe("get content from hub", () => {
    let requestOpts: IHubRequestOptions;
    beforeEach(() => {
      requestOpts = {
        portalSelf: {
          user: {},
          id: "123",
          isPortal: false,
          name: "some-portal",
        },
        isPortal: false,
        hubApiUrl: "https://some.url.com/",
        authentication: mockUserSession,
      };
    });
    afterEach(fetchMock.restore);
    it("should fetch a dataset record by id and return content", (done) => {
      fetchMock.once(
        "https://some.url.com/api/v3/datasets/7a153563b0c74f7eb2b3eae8a66f2fbb_0",
        featureLayerJson
      );
      fetchMock.once(
        "https://vader.maps.arcgis.com/sharing/rest/content/items/7a153563b0c74f7eb2b3eae8a66f2fbb?f=json&token=fake-token",
        itemJson
      );
      const dataset = featureLayerJson.data as DatasetResource;
      const datasetId = dataset.id;
      const itemId = parseDatasetId(datasetId).itemId;
      getContentFromHub(datasetId, requestOpts).then((content) => {
        // verify that we attempted to fetch from the portal API
        let [url, opts] = fetchMock.calls()[0];
        expect(url).toBe(`https://some.url.com/api/v3/datasets/${datasetId}`);
        expect(opts.method).toBe("GET");

        // verify that we attempted to fetch from the AGO API
        [url, opts] = fetchMock.calls()[1];
        expect(url).toBe(
          `https://vader.maps.arcgis.com/sharing/rest/content/items/${itemId}?f=json&token=fake-token`
        );
        expect(opts.method).toBe("GET");

        validateContentFromDataset(content, dataset, "dataset");

        // since we are authed, we will fetch the item and get this stuff from it
        expect(content.contentStatus).toEqual("org_authoritative");
        expect(content.spatialReference as string).toEqual(
          itemJson.spatialReference
        );

        // TODO: content type specific properties
        // expect(content.recordCount).toBe(attributes.recordCount);
        done();
      });
    });
    it("should fetch a dataset record by id when unauthenticated and return content", (done) => {
      fetchMock.once(
        "https://some.url.com/api/v3/datasets/7a153563b0c74f7eb2b3eae8a66f2fbb_0",
        featureLayerJson
      );
      const dataset = featureLayerJson.data as DatasetResource;
      const id = dataset.id;
      delete requestOpts.authentication;
      getContentFromHub(id, requestOpts).then((content) => {
        // verify that we attempted to fetch from the portal API
        const [url, opts] = fetchMock.calls()[0];
        expect(url).toBe(`https://some.url.com/api/v3/datasets/${id}`);
        expect(opts.method).toBe("GET");

        // verify fetch call count
        expect(fetchMock.calls().length).toBe(1);

        validateContentFromDataset(content, dataset, "dataset");

        // since we are not authed, we will get this stuff from the hub api response
        expect(content.contentStatus).toEqual("public_authoritative");
        expect(content.spatialReference).toEqual(
          dataset.attributes.serviceSpatialReference
        );

        // TODO: content type specific properties
        // expect(content.recordCount).toBe(attributes.recordCount);
        done();
      });
    });
    it("should fetch a dataset record by slug and return content", (done) => {
      const featureLayersJson = {
        // slug requests to datasets w/ filter which returns an array
        data: [featureLayerJson.data],
        meta: featureLayerJson.meta,
      };
      fetchMock.once(
        "https://some.url.com/api/v3/datasets?filter%5Bslug%5D=Wigan%3A%3Aout-of-work-benefit-claims",
        featureLayersJson
      );
      fetchMock.once(
        "https://vader.maps.arcgis.com/sharing/rest/content/items/7a153563b0c74f7eb2b3eae8a66f2fbb?f=json&token=fake-token",
        itemJson
      );
      const dataset = featureLayersJson.data[0] as DatasetResource;
      const ItemId = parseDatasetId(dataset.id).itemId;
      const slug = "Wigan::out-of-work-benefit-claims";
      getContentFromHub(slug, requestOpts).then((content) => {
        // verify that we attempted to fetch from the portal API
        let [url, opts] = fetchMock.calls()[0];
        expect(url).toBe(
          `https://some.url.com/api/v3/datasets?${encodeURIComponent(
            "filter[slug]"
          )}=${encodeURIComponent(slug)}`
        );
        expect(opts.method).toBe("GET");

        // verify that we attempted to fetch from the AGO API
        [url, opts] = fetchMock.calls()[1];
        expect(url).toBe(
          `https://vader.maps.arcgis.com/sharing/rest/content/items/${ItemId}?f=json&token=fake-token`
        );
        expect(opts.method).toBe("GET");

        validateContentFromDataset(content, dataset, "dataset");

        // since we are authed, we will fetch the item and get this stuff from it
        expect(content.contentStatus).toEqual("org_authoritative");
        expect(content.spatialReference as string).toEqual(
          itemJson.spatialReference
        );

        // TODO: content type specific properties
        // expect(content.recordCount).toBe(attributes.recordCount);
        done();
      });
    });
  });
});
