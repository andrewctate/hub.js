import { IModel } from "../types";
import { getProp } from "../objects";
import { SITE_SCHEMA_VERSION } from "./site-schema-version";
import { _applySiteSchema } from "./_apply-site-schema";
import { _enforceLowercaseDomains } from "./_enforce-lowercase-domains";
import { _ensureCatalog } from "./_ensure-catalog";
import { _purgeNonGuidsFromCatalog } from "./_purge-non-guids-from-catalog";
import { _ensureTelemetry } from "./_ensure-telemetry";
import { _migrateFeedConfig } from "./_migrate-feed-config";

/**
 * Upgrades the schema upgrades
 * @param model IModel
 */
export function upgradeSiteSchema(model: IModel) {
  if (getProp(model, "item.properties.schemaVersion") === SITE_SCHEMA_VERSION) {
    return model;
  } else {
    // apply upgrade functions in order...
    model = _applySiteSchema(model);
    model = _enforceLowercaseDomains(model);
    model = _ensureCatalog(model);
    model = _purgeNonGuidsFromCatalog(model);
    model = _ensureTelemetry<IModel>(model);
    model = _migrateFeedConfig(model);
    return model;
  }
}
