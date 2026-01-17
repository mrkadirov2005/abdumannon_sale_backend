import React, { useState, useEffect } from "react";
import { useFinanceLogic } from "./useFinanceLogic";
import { FinanceHeader } from "./components/FinanceHeader";
import { FinanceStats } from "./components/FinanceStats";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { SearchBar } from "./components/SearchBar";
import { FolderView } from "./components/FolderView";
import { ListView } from "./components/ListView";
import { DetailsPanel } from "./components/DetailsPanel";
import { PaymentModal } from "./components/PaymentModal";
import type { ViewMode } from "./types";

const Finance: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const {
    loading,
    searchQuery,
    selectedPerson,
    showPaymentModal,
    formData,
    uniquePersons,
    filteredPersons,
    selectedPersonData,
    wagons,
    financeRecords,
    setSearchQuery,
    setSelectedPerson,
    setShowPaymentModal,
    setFormData,
    fetchData,
    handleDeleteFinanceRecord,
    handleDeleteWagon,
    handleAddPayment,
  } = useFinanceLogic();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 md:p-8">
      <FinanceHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <FinanceStats
        uniquePersons={uniquePersons}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPersonSelect={setSelectedPerson}
      />

      <ViewModeToggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPersonDeselect={() => setSelectedPerson(null)}
      />

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Content */}
      {viewMode === "folders" ? (
        <FolderView
          persons={filteredPersons}
          selectedPerson={selectedPerson}
          onPersonSelect={setSelectedPerson}
        />
      ) : (
        <ListView wagons={wagons} onDeleteWagon={handleDeleteWagon} />
      )}

      {/* Details Panel */}
      {selectedPerson && selectedPersonData && viewMode === "folders" && (
        <DetailsPanel
          person={selectedPersonData}
          financeRecords={financeRecords}
          onAddPayment={() => setShowPaymentModal(true)}
          onDeleteWagon={handleDeleteWagon}
          onDeleteFinanceRecord={handleDeleteFinanceRecord}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        selectedPerson={selectedPerson}
        formData={formData}
        onFormChange={(data) => setFormData({ ...formData, ...data })}
        onAddPayment={() => handleAddPayment(selectedPerson || "")}
        onClose={() => {
          setShowPaymentModal(false);
          setFormData({
            amount: "",
            description: "",
            type: "income",
            category: "sales",
            date: new Date().toISOString().split("T")[0],
          });
        }}
      />
    </div>
  );
};

export default Finance;
