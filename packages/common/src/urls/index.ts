export * from "./build-url";
export * from "./get-hub-locale-asset-url";
export * from "./get-portal-api-url";
export * from "./get-portal-url";
export * from "./hub-cdn-urlmap";
export * from "./strip-protocol";
export * from "./_get-http-and-https-uris";
export * from "./_get-location";
export * from "./get-hub-api-url-from-portal";
export * from "./get-hub-url-from-portal";
export * from "./get-item-home-url";
export * from "./get-item-api-url";
export * from "./get-item-data-url";

export const isMapOrFeatureServerUrl = (url: string) => {
  return /\/(map|feature)server/i.test(url);
};
