/*
  USAGE EXAMPLE FOR UpdateAdminModal COMPONENT
  
  This shows how to integrate the UpdateAdminModal component into your page.
*/

import { useState } from "react";
import UpdateAdminModal from "../components/admin/UpdateAdminModal";
import type { Admin } from "../types/types";
import { toast } from "react-toastify";

// Example implementation in your admin/users page:

export function AdminPageExample() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]); // Your admins from Redux

  // Connect this to your API
  const handleUpdateAdmin = async (updatedAdmin: Admin) => {
    try {
      // STEP 1: Call your API endpoint here
      // Example:
      // const response = await updateAdminAPI({
      //   token: yourAccessToken,
      //   admin: updatedAdmin
      // });

      // For now, just show the data that will be sent to API
      console.log("Admin data ready to update:", updatedAdmin);

      // STEP 2: After API call succeeds, show success message
      toast.success(`${updatedAdmin.first_name} updated successfully!`);

      // STEP 3: Optionally refresh the admins list
      // dispatch(getShopAdminsThunk({ shop_id, token }));
    } catch (error) {
      toast.error("Failed to update admin");
      console.error(error);
    }
  };

  return (
    <div>
      {/* BUTTON TO OPEN MODAL */}
      <button
        onClick={() => setShowUpdateModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Update Admin
      </button>

      {/* UPDATE ADMIN MODAL */}
      <UpdateAdminModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        admins={admins}
        onUpdate={handleUpdateAdmin}
      />
    </div>
  );
}

/*
  INTEGRATION STEPS:
  
  1. Import the component in your Admin/Users page:
     import UpdateAdminModal from "../../components/admin/UpdateAdminModal";
  
  2. Add state for showing the modal:
     const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  3. Create a handler function for updating admin:
     const handleUpdateAdmin = async (updatedAdmin: Admin) => {
       // Call your API with updatedAdmin
       // Then dispatch getShopAdminsThunk to refresh list
     };
  
  4. Add the modal component:
     <UpdateAdminModal
       isOpen={showUpdateModal}
       onClose={() => setShowUpdateModal(false)}
       admins={adminsFromStore}
       onUpdate={handleUpdateAdmin}
     />
  
  5. Add a button to trigger the modal:
     <button onClick={() => setShowUpdateModal(true)}>
       Update Admin
     </button>
*/
