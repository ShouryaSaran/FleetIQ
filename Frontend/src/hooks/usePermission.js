import { useAuth } from "./useAuth";
import logger from "../utils/logger";

// null means all authenticated roles are allowed
const PERMISSIONS = {
  cars:              { view: null,                                      create: ["Admin","Manager","Sales Executive"], edit: ["Admin","Manager","Sales Executive"], delete: ["Admin","Manager"] },
  customers:         { view: ["Admin","Manager","Sales Executive"],     create: ["Admin","Manager","Sales Executive"], edit: ["Admin","Manager","Sales Executive"], delete: ["Admin","Manager"] },
  suppliers:         { view: ["Admin","Manager"],                       create: ["Admin","Manager"],                   edit: ["Admin","Manager"],                   delete: ["Admin","Manager"] },
  inventory:         { view: null,                                      create: ["Admin","Manager"],                   edit: ["Admin","Manager"],                   delete: ["Admin","Manager"] },
  sales:             { view: ["Admin","Manager","Sales Executive"],     create: ["Admin","Manager","Sales Executive"], edit: ["Admin","Manager","Sales Executive"], delete: ["Admin","Manager"] },
  payments:          { view: ["Admin","Manager","Sales Executive"],     create: ["Admin","Manager","Sales Executive"], edit: ["Admin","Manager","Sales Executive"], delete: ["Admin","Manager"] },
  service:           { view: ["Admin","Manager","Mechanic"],            create: ["Admin","Manager","Mechanic"],        edit: ["Admin","Manager","Mechanic"],        delete: ["Admin","Manager"] },
  "service-centers": { view: ["Admin","Manager","Mechanic"],            create: ["Admin","Manager"],                   edit: ["Admin","Manager"],                   delete: ["Admin","Manager"] },
  reports:           { view: ["Admin","Manager"],                       create: ["Admin","Manager"],                   edit: ["Admin","Manager"],                   delete: ["Admin","Manager"] },
  users:             { view: ["Admin"],                                 create: ["Admin"],                             edit: ["Admin"],                             delete: ["Admin"] },
};

export function usePermission(resource) {
  const { user } = useAuth();
  const role = user?.role_name;
  const p = PERMISSIONS[resource] ?? {};

  const check = (list, action) => {
    const result = !!role && (list === null ? true : Array.isArray(list) && list.includes(role));
    logger.role(`Checking permission: ${action} on ${resource} → ${result} (${role})`);
    return result;
  };

  return {
    canView:   check(p.view   ?? null,  "canView"),
    canCreate: check(p.create ?? [],    "canCreate"),
    canEdit:   check(p.edit   ?? [],    "canEdit"),
    canDelete: check(p.delete ?? [],    "canDelete"),
  };
}
