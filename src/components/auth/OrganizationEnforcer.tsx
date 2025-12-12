"use client";

import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { useEffect } from "react";

export default function OrganizationEnforcer() {
  const { isLoaded, orgId } = useAuth();
  const { userMemberships, isLoaded: isMembershipsLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  useEffect(() => {
    if (!isLoaded || !isMembershipsLoaded || !setActive) {
      return;
    }

    // If the user has memberships but no active organization (personal context),
    // switch to the first organization.
    if (!orgId && userMemberships.count > 0) {
      const firstOrgId = userMemberships.data?.[0]?.organization.id;
      if (firstOrgId) {
        void setActive({ organization: firstOrgId }).then(() => {
          // Force a reload to ensure the new organization context is fully propagated
          // throughout the app, including Supabase and other state.
          window.location.reload();
        });
      }
    }
  }, [isLoaded, isMembershipsLoaded, orgId, userMemberships, setActive]);

  return null;
}
