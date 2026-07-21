import { useState, useEffect } from 'react';

export default function usePermission(moduleKey) {
  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canExportExcel: false,
    canExportPDF: false,
    canPrint: false,
    canUpload: false,
    canDownload: false,
    isSuperAdmin: false
  });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.module_permissions) {
          if (user.module_permissions.is_super_admin) {
            setPermissions({
              canView: true, canCreate: true, canEdit: true, canDelete: true,
              canApprove: true, canReject: true, canExportExcel: true,
              canExportPDF: true, canPrint: true, canUpload: true,
              canDownload: true, isSuperAdmin: true
            });
            return;
          }

          const mods = user.module_permissions.permissions || {};
          const modPerms = mods[moduleKey] || {};

          setPermissions({
            canView: !!modPerms['View'],
            canCreate: !!modPerms['Create'],
            canEdit: !!modPerms['Edit'],
            canDelete: !!modPerms['Delete'],
            canApprove: !!modPerms['Approve'],
            canReject: !!modPerms['Reject'],
            canExportExcel: !!modPerms['Export Excel'],
            canExportPDF: !!modPerms['Export PDF'],
            canPrint: !!modPerms['Print'],
            canUpload: !!modPerms['Upload'],
            canDownload: !!modPerms['Download'],
            isSuperAdmin: false
          });
        }
      }
    } catch (e) {
      console.error("Error reading permissions", e);
    }
  }, [moduleKey]);

  return permissions;
}
