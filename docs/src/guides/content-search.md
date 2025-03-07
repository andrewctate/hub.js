---
title: Searching for Content
navTitle: Searching Content
description: Leveraging the Hub Search system
group: 2-concepts
order: 15
---

## Searching for Content

Unified Content Search can be performed in two different ways: the `searchContent` function and the `ContentSearchService` class. Both provide a mechanism to search for content from the Portal API only or from both ArcGIS Online and Hub Indexer's V3 Search API (hereafter known as `V3 Search API`), depending on how `searchContent` function is invoked, or how the `ContentSearchService` is configured. They use the same underlying search functions for consistency.

### Instantiating the Content Search Service

The Content Search Service takes the following parameters to instantiate:

1. `portal`: a portal sharing url string
2. `isPortal`: a boolean flag indicating whether service is being instantiated in enterprise environment
3. `authentication`: an optional `UserSession` object for authentication.

Examples:

```
const contentSearchService = new ContentSearchService({
  portal: "https://qa-pre-hub.mapsqa.arcgis.com/sharing/rest",
  isPortal: false,
  authentication: new UserSession(...)
});
```

By contrast, the standalone `searchContent` function takes these values from an `options` object provided to it (see below).

### Performing Content Searches

Both the standalone `searchContent` function and the `search` method of the `ContentSearchService` take a parameters object with optional `filter` and `options` properties.

```js
const resultsOne = await searchContent({ filter, options });
const resultsTwo = await contentSearchService.search({ filter, options });
```

The `filter` property is an instance of `IContentSearchFilter`. This interface explicitly defines several fields searchable by the Portal API. Each property, with the exception of date-related fields, can take:

- a string, OR
- an array of strings, OR
- an instance of the `IContentFieldFilter` interface

Strings are interpreted as single values by which to filter. Arrays of strings are interpreted as a list of values `OR`'d together for a particular field.

The `IContentFieldFilter` interface provides a more granular interface for constructing filters. It offers a `bool` property defining a boolean operation for joining provided values (defaulting to `OR`) and a `value` property representing an array of string values. These values are joined to gether by the boolean.

Examples:

```js
// corresponds to (tag: TAG_ONE OR tag: TAG_TWO)
const filterOne = { tag: { bool: "OR", value: ["TAG_ONE", "TAG_TWO"] } };

// corresponds to (tag: TAG_ONE AND tag: TAG_TWO)
const filterTwo = { tag: { bool: "AND", value: ["TAG_ONE", "TAG_TWO"] } };

// corresponds to (-tag: TAG_ONE AND -tag: TAG_TWO)
const filterThree = { tag: { bool: "NOT", value: ["TAG_ONE", "TAG_TWO"] } };
```

Through these three options, large filters can be constructed. As a default, items of type `code attachment` are excluded from search.

Example:

```js
// corresponds to `(water) AND (owner: me OR owner: you) AND (created: [1609459200000 TO 1612137600000]) AND (modified: [1609459200000 TO 1612137600000]) AND (-title: "a title" AND -title: "b title") AND (typekeywords: "a type keyword") AND (tags: "tag 1" OR tags: "tag 2" OR tags: "tag 3") AND (type: "Feature Layer" OR type: "Table" OR type: "CSV") AND (access: private) AND (culture: en OR culture: de) AND (categories: "category one" AND categories: "category 2" AND categories: "category three") AND (-type: "code attachment")`

const filters = {
  terms: "water",
  owner: ["me", "you"],
  created: { from: 1609459200000, to: 1612137600000 },
  modified: { from: 1609459200000, to: 1612137600000 },
  title: { bool: "NOT", value: ["a title", "b title"] },
  typekeywords: "a type keyword",
  tags: ["tag 1", "tag 2", "tag 3"],
  type: { value: ["Feature Layer", "Table", "CSV"] },
  access: "private",
  culture: ["en", "de"],
  categories: {
    value: ["category one", "category 2", "category three"],
    bool: "AND",
  },
};
```

The `options` property provides several familar options for sorting and paging data, as well as requesting aggregations. These are specified by the `IContentSearchOptions` interface. Importantly, a user can also provide an `UserSession` instance as part of the options for authenticated searches. For the `searchContent` function, the client must provide the UserSession instance, `portal` sharing url, and `isPortal` flag, as needed, for each invocation. This is because it is a standalone function with no default options to reference. By contrast, the `ContentSearchService` will use the options it was configured with as a default if the relevant option is not provided.

### Content Search Results

The results of a content search could include:

- `results`: a list of content returned from the search
- `count`: the number of results returned from the request
- `total`: the total number of results that will be returned from multiple paginated searches
- `query`: the stringified query used to complete the search,
- `aggregations`: any aggregations returned
- `hasNext`: a boolean indicating if there are more pages of results
- `next`: a function that, when invoked, will fetch the next page of results

Importantly, one can optionally provide a UserSession instance to the `next` function invocation to be used for authenticated searches

```js
const nextResponse = await firstResponse.next(userSession);
```

### Known caveats with the V3 Search API

There are a few caveats concerning the V3 Search API. If these are an issue, one still should be able to instantiate the `ContentSearchService` with `isPortal: true` to limit searching to the Portal API, or simply query the API directly.

1. Multiple cross-field searching is not currently possible.
   Single cross-field searching is possible. For example, one can search for any public Feature Services.
   `(type: "Feature Service" AND access: public)`

However, multiple cross-field searching is not.
`(type: "Feature Service" AND access: public) OR (type: "Table" AND access: private)`

2. Fuzzy searching cannot be field-specific
   The Portal API allows fuzzy searching via a search term or on specific properties such as `title` and `description`. For example `(title: "Brampton")` will perform a search for "Brampton" in the title. By contrast, V3 Search API only provides a search term that is used across many different properties such as `searchDescription`.

**Importantly, this means that, when searching the V3 Search API, supplying filter values for these fields will be interpeted as an exact search, leading to very few results. Fuzzy searching should be done via the search term**

3. NOTs cannot be combined with non-NOT operators on the same field
   `(tag: TAG_ONE AND NOT tag: TAG_TWO)`

4. Events that are `planned`, `cancelled` or in `draft` are not returned.
