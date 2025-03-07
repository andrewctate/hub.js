import { UserSession } from "@esri/arcgis-rest-auth";
import { convertToPortalParams } from "../../../src/content/helpers/convert-request-to-portal-params";
import { SortDirection } from "../../../src/types/common";
import {
  IBooleanOperator,
  IContentSearchFilter,
  IContentSearchOptions,
} from "../../../src/types/content";
import { btoa } from "@esri/hub-common";

describe("Convert Portal Params Function", () => {
  it("can convert content filters to Portal API filters", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: ["me", "you"],
      created: { from: 1609459200000, to: 1612137600000 },
      modified: { from: 1609459200000, to: 1612137600000 },
      title: { bool: IBooleanOperator.NOT, value: ["a title", "b title"] },
      typekeywords: "a type keyword",
      tags: ["tag 1", "tag 2", "tag 3"],
      type: { value: ["Feature Layer", "Table", "CSV"] },
      access: "private",
      culture: ["en", "de"],
      categories: {
        value: ["category one", "category 2", "category three"],
        bool: IBooleanOperator.AND,
      },
    };

    // Test
    const portalParams = convertToPortalParams({ filter: filters });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (owner: me OR owner: you) AND (created: [1609459200000 TO 1612137600000]) AND (modified: [1609459200000 TO 1612137600000]) AND (-title: "a title" AND -title: "b title") AND (typekeywords: "a type keyword") AND (tags: "tag 1" OR tags: "tag 2" OR tags: "tag 3") AND (type: "Feature Layer" OR type: "Table" OR type: "CSV") AND (access: private) AND (culture: en OR culture: de) AND (categories: "category one" AND categories: "category 2" AND categories: "category three") AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeUndefined();
    expect(portalParams.sortField).toBeUndefined();
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can handle partially applied created/modified filters", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: ["me", "you"],
      created: { from: 1609459200000 },
      modified: { to: 1612137600000 },
      title: { bool: IBooleanOperator.NOT, value: ["a title", "b title"] },
      typekeywords: "a type keyword",
      tags: ["tag 1", "tag 2", "tag 3"],
      type: { value: ["Feature Layer", "Table", "CSV"] },
      access: "private",
      culture: ["en", "de"],
      categories: {
        value: ["category one", "category 2", "category three"],
        bool: IBooleanOperator.AND,
      },
    };

    // Test
    const portalParams = convertToPortalParams({ filter: filters });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    const q = portalParams.q as string;
    expect(q.includes("created: [1609459200000 TO")).toBeTruthy();
    expect(q.includes("modified: [0 TO 1612137600000]")).toBeTruthy();
    expect(portalParams.sortOrder).toBeUndefined();
    expect(portalParams.sortField).toBeUndefined();
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can handle empty strings, empty arrays and malformed filters", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: [],
      created: { from: 1609459200000, to: 1612137600000 },
      modified: { from: 1609459200000, to: 1612137600000 },
      title: { bool: IBooleanOperator.NOT, value: [] },
      typekeywords: "",
      tags: ["tag 1", "tag 2", "tag 3"],
      type: { value: null },
      access: "",
      culture: [],
      categories: null,
    };

    // Test
    const portalParams = convertToPortalParams({ filter: filters });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (created: [1609459200000 TO 1612137600000]) AND (modified: [1609459200000 TO 1612137600000]) AND (tags: "tag 1" OR tags: "tag 2" OR tags: "tag 3") AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeUndefined();
    expect(portalParams.sortField).toBeUndefined();
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can convert content filters to Portal API filters with proper paging", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: ["me", "you"],
      created: { from: 1609459200000, to: 1612137600000 },
      modified: { from: 1609459200000, to: 1612137600000 },
      title: { bool: IBooleanOperator.NOT, value: ["a title", "b title"] },
      typekeywords: "a type keyword",
      tags: ["tag 1", "tag 2", "tag 3"],
      type: { value: ["Feature Layer", "Table", "CSV"] },
      access: "private",
      culture: ["en", "de"],
      categories: {
        value: ["category one", "category 2", "category three"],
        bool: IBooleanOperator.AND,
      },
    };

    const page: string = "eyJzdGFydCI6NSwibnVtIjoyMH0=";

    // Test
    const portalParams = convertToPortalParams({
      filter: filters,
      options: { page },
    });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (owner: me OR owner: you) AND (created: [1609459200000 TO 1612137600000]) AND (modified: [1609459200000 TO 1612137600000]) AND (-title: "a title" AND -title: "b title") AND (typekeywords: "a type keyword") AND (tags: "tag 1" OR tags: "tag 2" OR tags: "tag 3") AND (type: "Feature Layer" OR type: "Table" OR type: "CSV") AND (access: private) AND (culture: en OR culture: de) AND (categories: "category one" AND categories: "category 2" AND categories: "category three") AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeUndefined();
    expect(portalParams.sortField).toBeUndefined();
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(5);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(20);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can handle an error occuring upon decoding a page", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: ["me", "you"],
      created: { from: 1609459200000, to: 1612137600000 },
      modified: { from: 1609459200000, to: 1612137600000 },
      title: { bool: IBooleanOperator.NOT, value: ["a title", "b title"] },
      typekeywords: "a type keyword",
      tags: ["tag 1", "tag 2", "tag 3"],
      type: { value: ["Feature Layer", "Table", "CSV"] },
      access: "private",
      culture: ["en", "de"],
      categories: {
        value: ["category one", "category 2", "category three"],
        bool: IBooleanOperator.AND,
      },
    };
    const testInvalidPageOption = (pageOption: string) => {
      // Test
      const portalParams = convertToPortalParams({
        filter: filters,
        options: { page: pageOption },
      });

      // Assert
      expect(portalParams).toBeDefined();
      expect(portalParams.q).toBeDefined();
      expect(portalParams.q).toEqual(
        `(water) AND (owner: me OR owner: you) AND (created: [1609459200000 TO 1612137600000]) AND (modified: [1609459200000 TO 1612137600000]) AND (-title: "a title" AND -title: "b title") AND (typekeywords: "a type keyword") AND (tags: "tag 1" OR tags: "tag 2" OR tags: "tag 3") AND (type: "Feature Layer" OR type: "Table" OR type: "CSV") AND (access: private) AND (culture: en OR culture: de) AND (categories: "category one" AND categories: "category 2" AND categories: "category three") AND (-type: "code attachment")`
      );
      expect(portalParams.sortOrder).toBeUndefined();
      expect(portalParams.sortField).toBeUndefined();
      expect(portalParams.params).toBeDefined();
      expect(portalParams.params.start).toBeDefined();
      expect(portalParams.params.start).toEqual(1);
      expect(portalParams.params.num).toBeDefined();
      expect(portalParams.params.num).toEqual(10);
      expect(portalParams.params.countFields).toBeUndefined();
      expect(portalParams.params.countSize).toBeUndefined();
      expect(portalParams.bbox).toBeUndefined();
    };

    testInvalidPageOption("invalid base 64");
    testInvalidPageOption(btoa("invalid serialized json"));
  });

  it("can convert content filters to Portal API filters with proper sorting", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions = { sortField: "title", sortOrder: SortDirection.desc };

    // Test
    const portalParams = convertToPortalParams({
      filter: filters,
      options: portalOptions,
    });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can convert content filters to Portal API filters with proper sorting and aggregations", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions = {
      sortField: "title",
      sortOrder: SortDirection.desc,
      aggregations: "categories,type,access",
    };

    // Test
    const portalParams = convertToPortalParams({
      filter: filters,
      options: portalOptions,
    });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeDefined();
    expect(portalParams.params.countFields).toEqual("categories,type,access");
    expect(portalParams.params.countSize).toBeDefined();
    expect(portalParams.params.countSize).toEqual(200);
    expect(portalParams.bbox).toBeUndefined();
  });

  it("can convert content filters to Portal API filters with proper sorting, aggregations and bbx", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions = {
      sortField: "title",
      sortOrder: SortDirection.desc,
      aggregations: "categories,type,access",
      bbox: "bbox",
    };

    // Test
    const portalParams = convertToPortalParams({
      filter: filters,
      options: portalOptions,
    });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeDefined();
    expect(portalParams.params.countFields).toEqual("categories,type,access");
    expect(portalParams.params.countSize).toBeDefined();
    expect(portalParams.params.countSize).toEqual(200);
    expect(portalParams.bbox).toBeDefined();
    expect(portalParams.bbox).toEqual("bbox");
  });

  it("prioritizes portal sharing url and session from options over those provided from service", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions: IContentSearchOptions = {
      sortField: "title",
      sortOrder: SortDirection.desc,
      aggregations: "categories,type,access",
      bbox: "bbox",
      portal: "dummy-portal-sharing-one",
      authentication: new UserSession({ portal: "dummy-portal-one" }),
    };

    // Test
    const portalParams = convertToPortalParams(
      {
        filter: filters,
        options: portalOptions,
      },
      "dummy-portal-sharing-two",
      new UserSession({ portal: "dummy-portal-two" })
    );

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeDefined();
    expect(portalParams.params.countFields).toEqual("categories,type,access");
    expect(portalParams.params.countSize).toBeDefined();
    expect(portalParams.params.countSize).toEqual(200);
    expect(portalParams.bbox).toBeDefined();
    expect(portalParams.bbox).toEqual("bbox");
    expect(portalParams.portal).toBeDefined();
    expect(portalParams.portal).toEqual("dummy-portal-sharing-one");
    expect(portalParams.authentication).toBeDefined();
    expect(portalParams.authentication.portal).toEqual("dummy-portal-one");
  });

  it("uses portal sharing url and session from service if not provided from request options", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions: IContentSearchOptions = {
      sortField: "title",
      sortOrder: SortDirection.desc,
      aggregations: "categories,type,access",
      bbox: "bbox",
    };

    // Test
    const portalParams = convertToPortalParams(
      {
        filter: filters,
        options: portalOptions,
      },
      "dummy-portal-sharing-two",
      new UserSession({ portal: "dummy-portal-two" })
    );

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeDefined();
    expect(portalParams.params.countFields).toEqual("categories,type,access");
    expect(portalParams.params.countSize).toBeDefined();
    expect(portalParams.params.countSize).toEqual(200);
    expect(portalParams.bbox).toBeDefined();
    expect(portalParams.bbox).toEqual("bbox");
    expect(portalParams.portal).toBeDefined();
    expect(portalParams.portal).toEqual("dummy-portal-sharing-two");
    expect(portalParams.authentication).toBeDefined();
    expect(portalParams.authentication.portal).toEqual("dummy-portal-two");
  });

  it("sends undefined portal sharing url and session if provided from neither options nor service", () => {
    // Setup
    const filters: IContentSearchFilter = {
      terms: "water",
      owner: { bool: IBooleanOperator.NOT, value: ["me", "you"] },
      created: { from: 1577836800000, to: 1580515200000 },
      modified: { from: 1580515200000, to: 1583020800000 },
      title: ["title 1", "title 2", "title 3"],
      typekeywords: "a type keyword",
      tags: { value: ["tag 1", "tag 2", "tag 3"], bool: IBooleanOperator.AND },
      type: "Feature Layer",
      access: ["private", "org"],
      culture: "en",
      categories: { value: ["category one", "category 2", "category three"] },
      orgid: ["org one", "org two"],
      id: { value: ["1", "2", "3"], bool: IBooleanOperator.NOT },
    };

    const portalOptions: IContentSearchOptions = {
      sortField: "title",
      sortOrder: SortDirection.desc,
      aggregations: "categories,type,access",
      bbox: "bbox",
    };

    // Test
    const portalParams = convertToPortalParams({
      filter: filters,
      options: portalOptions,
    });

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(
      `(water) AND (-owner: me AND -owner: you) AND (created: [1577836800000 TO 1580515200000]) AND (modified: [1580515200000 TO 1583020800000]) AND (title: "title 1" OR title: "title 2" OR title: "title 3") AND (typekeywords: "a type keyword") AND (tags: "tag 1" AND tags: "tag 2" AND tags: "tag 3") AND (type: "Feature Layer") AND (access: private OR access: org) AND (culture: en) AND (categories: "category one" OR categories: "category 2" OR categories: "category three") AND (orgid: org one OR orgid: org two) AND (-id: 1 AND -id: 2 AND -id: 3) AND (-type: "code attachment")`
    );
    expect(portalParams.sortOrder).toBeDefined();
    expect(portalParams.sortOrder).toEqual("desc");
    expect(portalParams.sortField).toBeDefined();
    expect(portalParams.sortField).toEqual("title");
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeDefined();
    expect(portalParams.params.countFields).toEqual("categories,type,access");
    expect(portalParams.params.countSize).toBeDefined();
    expect(portalParams.params.countSize).toEqual(200);
    expect(portalParams.bbox).toBeDefined();
    expect(portalParams.bbox).toEqual("bbox");
    expect(portalParams.portal).toBeUndefined();
    expect(portalParams.authentication).toBeUndefined();
  });

  it("can handle a falsey filter object", () => {
    // Test
    const portalParams = convertToPortalParams({});

    // Assert
    expect(portalParams).toBeDefined();
    expect(portalParams.q).toBeDefined();
    expect(portalParams.q).toEqual(`(-type: "code attachment")`);
    expect(portalParams.sortOrder).toBeUndefined();
    expect(portalParams.sortField).toBeUndefined();
    expect(portalParams.params).toBeDefined();
    expect(portalParams.params.start).toBeDefined();
    expect(portalParams.params.start).toEqual(1);
    expect(portalParams.params.num).toBeDefined();
    expect(portalParams.params.num).toEqual(10);
    expect(portalParams.params.countFields).toBeUndefined();
    expect(portalParams.params.countSize).toBeUndefined();
    expect(portalParams.bbox).toBeUndefined();
  });
});
