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
import { MyDebtModal } from "./components/MyDebtModal";
import type { ViewMode, FinanceSource } from "./types";

const Finance: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const [source, setSource] = useState<FinanceSource>("wagons");
  const [showMyDebtModal, setShowMyDebtModal] = useState(false);
  const [myDebtAdminOverride, setMyDebtAdminOverride] = useState<
    "qarzlarim" | "qarzdorlar" | null
  >(null);
  const [myDebtForm, setMyDebtForm] = useState({
    lender: "",
    amount: "",
    comment: "",
    isReturned: false,
    date: new Date().toISOString().split("T")[0],
  });
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
    debts,
    financeRecords,
    setSearchQuery,
    setSelectedPerson,
    setShowPaymentModal,
    setFormData,
    fetchData,
    handleDeleteFinanceRecord,
    handleDeleteWagon,
    handleDeleteDebt,
    handleAddPayment,
    handleAddMyDebt,
    markDebtsReturned,
    myDebtsCardTotals,
  } = useFinanceLogic(source);

  const shouldShowPulQoshish =
    !!selectedPersonData &&
    ((source === "debts") ||
      (source === "myDebts" &&
        !(selectedPersonData.debts || []).some((debt) => debt.admin_id === "qarzlarim")));

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Юкланмоқда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 md:p-8">
      <FinanceHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        source={source}
        onSourceChange={(next) => {
          setSource(next);
          setSelectedPerson(null);
          setViewMode("folders");
        }}
        onAddMyDebt={() => setShowMyDebtModal(true)}
      />

      <FinanceStats
        uniquePersons={uniquePersons}
        source={source}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPersonSelect={setSelectedPerson}
        myDebtsCardTotals={myDebtsCardTotals}
      />

      <ViewModeToggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPersonDeselect={() => setSelectedPerson(null)}
      />

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Content */}
      {viewMode === "folders" ? (
        selectedPerson ? (
          <div className="mb-4">
            <button
              onClick={() => setSelectedPerson(null)}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
            >
              ← Орқага
            </button>
          </div>
        ) : (
          <FolderView
            persons={filteredPersons}
            selectedPerson={selectedPerson}
            onPersonSelect={setSelectedPerson}
            source={source}
          />
        )
      ) : (
      <ListView
        wagons={wagons}
        debts={debts}
        source={source}
        onDeleteWagon={handleDeleteWagon}
        onDeleteDebt={handleDeleteDebt}
      />
      )}

      {/* Details Panel */}
      {selectedPerson && selectedPersonData && viewMode === "folders" && (
        <DetailsPanel
          person={selectedPersonData}
          financeRecords={financeRecords}
          onAddPayment={() => setShowPaymentModal(true)}
          onAddMyDebtFromDebts={() => {
            if (source === "debts") {
              setMyDebtForm((prev) => ({
                ...prev,
                lender: selectedPerson || prev.lender,
              }));
            }
            if (source === "myDebts") {
              setMyDebtForm((prev) => ({
                ...prev,
                lender: selectedPerson || prev.lender,
              }));
            }
            setMyDebtAdminOverride("qarzdorlar");
            setShowMyDebtModal(true);
          }}
          showPulQoshish={shouldShowPulQoshish}
          onDeleteWagon={handleDeleteWagon}
          onDeleteFinanceRecord={handleDeleteFinanceRecord}
          onDeleteDebt={handleDeleteDebt}
          source={source}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        selectedPerson={selectedPerson}
        formData={formData}
        onFormChange={(data) => setFormData({ ...formData, ...data })}
        onAddPayment={async () => {
          if ((source === "myDebts" || source === "valyutchik") && selectedPersonData) {
            const amount = parseFloat(formData.amount || "0");
            const delta = formData.type === "income" ? amount : -amount;
            const nextPaid = selectedPersonData.paidAmount + delta;
            const total = selectedPersonData.totalAmount;

            await handleAddPayment(selectedPerson || "", selectedPersonData?.debts);

            if (nextPaid >= total) {
              await markDebtsReturned(selectedPersonData.debts || []);
            }
            return;
          }

          await handleAddPayment(selectedPerson || "", selectedPersonData?.debts);
        }}
        onClose={() => {
          setShowPaymentModal(false);
          setFormData({
            amount: "",
            description: "",
            type: "income",
            category: source === "myDebts" || source === "valyutchik" ? "my_debt" : "sales",
            date: new Date().toISOString().split("T")[0],
          });
        }}
        hideCategory={source === "myDebts" || source === "valyutchik"}
      />

      <MyDebtModal
        isOpen={showMyDebtModal}
        formData={myDebtForm}
        onFormChange={(data) => setMyDebtForm({ ...myDebtForm, ...data })}
        onSubmit={async () => {
          await handleAddMyDebt(
            myDebtForm.lender,
            Number(myDebtForm.amount),
            myDebtForm.comment,
            myDebtForm.isReturned,
            myDebtForm.date,
            myDebtAdminOverride || undefined
          );
          setShowMyDebtModal(false);
          setMyDebtAdminOverride(null);
          setMyDebtForm({
            lender: "",
            amount: "",
            comment: "",
            isReturned: false,
            date: new Date().toISOString().split("T")[0],
          });
        }}
        onClose={() => {
          setShowMyDebtModal(false);
          setMyDebtAdminOverride(null);
          setMyDebtForm({
            lender: "",
            amount: "",
            comment: "",
            isReturned: false,
            date: new Date().toISOString().split("T")[0],
          });
        }}
      />
    </div>
  );
};

export default Finance;
