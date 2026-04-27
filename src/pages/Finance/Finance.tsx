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
import { EditDebtModal } from "./components/EditDebtModal";
import type { ViewMode, FinanceSource, FinanceRecord, Debt } from "./types";

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
  const [editingFinanceRecord, setEditingFinanceRecord] = useState<FinanceRecord | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showEditDebtModal, setShowEditDebtModal] = useState(false);
  const [editDebtForm, setEditDebtForm] = useState({
    amount: "",
    comment: "",
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
    handleReplaceFinanceRecord,
    handleAddMyDebt,
    handleUpdateMyDebt,
    markDebtsReturned,
    myDebtsCardTotals,
  } = useFinanceLogic(source);

  const getDefaultPaymentForm = () => ({
    amount: "",
    description: "",
    type: "income" as const,
    category: source === "myDebts" || source === "valyutchik" ? "my_debt" : "sales",
    date: new Date().toISOString().split("T")[0],
  });

  const extractEditableDescription = (description?: string) => {
    if (!description) return "";
    const parts = description.split(": ");
    if (parts.length <= 1) return description;
    const rest = parts.slice(1).join(": ");
    return rest.replace(/^\[(valyutchik|qarzlarim)\]\s*/i, "");
  };

  const openCreatePaymentModal = () => {
    setEditingFinanceRecord(null);
    setFormData(getDefaultPaymentForm());
    setShowPaymentModal(true);
  };

  const openEditPaymentModal = (record: FinanceRecord) => {
    setEditingFinanceRecord(record);
    setFormData({
      amount: record.amount,
      description: extractEditableDescription(record.description),
      type: record.type,
      category: record.category,
      date: String(record.date).split("T")[0],
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setEditingFinanceRecord(null);
    setFormData(getDefaultPaymentForm());
  };

  const openEditDebtModal = (debt: Debt) => {
    // Editing debts from "wagons" or generic "qarzdorlar" in Finance doesn't make sense.
    if (!(source === "myDebts" || source === "valyutchik")) return;

    setEditingDebt(debt);
    // backend sometimes returns product_names as array; keep UI robust
    const rawComment: any = (debt as any)?.product_names;
    const normalizedComment = Array.isArray(rawComment)
      ? rawComment.filter(Boolean).join("|")
      : String(rawComment ?? "");

    setEditDebtForm({
      amount: String(debt.amount ?? ""),
      comment: normalizedComment,
    });
    setShowEditDebtModal(true);
  };

  const closeEditDebtModal = () => {
    setShowEditDebtModal(false);
    setEditingDebt(null);
    setEditDebtForm({ amount: "", comment: "" });
  };

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
          setShowPaymentModal(false);
          setEditingFinanceRecord(null);
          setShowEditDebtModal(false);
          setEditingDebt(null);
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
        onPersonDeselect={() => {
          setSelectedPerson(null);
          setShowPaymentModal(false);
          setEditingFinanceRecord(null);
          setShowEditDebtModal(false);
          setEditingDebt(null);
        }}
      />

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Content */}
      {viewMode === "folders" ? (
        !selectedPerson && (
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
        onEditDebt={openEditDebtModal}
      />
      )}

      {/* Details Panel */}
      {selectedPerson && selectedPersonData && viewMode === "folders" && (
        <DetailsPanel
          person={selectedPersonData}
          financeRecords={financeRecords}
          onAddPayment={openCreatePaymentModal}
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
          onEditDebt={openEditDebtModal}
          source={source}
          onBackToOverview={() => setSelectedPerson(null)}
          onEditFinanceRecord={openEditPaymentModal}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        selectedPerson={selectedPerson}
        formData={formData}
        onFormChange={(data) => setFormData({ ...formData, ...data })}
        onAddPayment={async () => {
          if (editingFinanceRecord) {
            const success = await handleReplaceFinanceRecord(
              editingFinanceRecord.id,
              selectedPerson || "",
              formData,
              selectedPersonData?.debts
            );

            if (success) {
              setEditingFinanceRecord(null);
            }
            return;
          }

          if ((source === "myDebts" || source === "valyutchik") && selectedPersonData) {
            const amount = parseFloat(formData.amount || "0");
            const delta = formData.type === "income" ? amount : -amount;
            const nextPaid = selectedPersonData.paidAmount + delta;
            const total = selectedPersonData.totalAmount;

            const success = await handleAddPayment(selectedPerson || "", selectedPersonData?.debts, formData);

            if (success && nextPaid >= total) {
              await markDebtsReturned(selectedPersonData.debts || []);
            }
            return;
          }

          await handleAddPayment(selectedPerson || "", selectedPersonData?.debts, formData);
        }}
        onClose={closePaymentModal}
        hideCategory={source === "myDebts" || source === "valyutchik"}
        title={editingFinanceRecord ? "Moliya yozuvini tahrirlash" : undefined}
        submitLabel={editingFinanceRecord ? "Yangilash" : undefined}
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

      <EditDebtModal
        isOpen={showEditDebtModal}
        debt={editingDebt}
        formData={editDebtForm}
        onFormChange={(data) => setEditDebtForm({ ...editDebtForm, ...data })}
        onSubmit={async () => {
          if (!editingDebt) return;
          const ok = await handleUpdateMyDebt(editingDebt, {
            amount: Number(editDebtForm.amount),
            comment: editDebtForm.comment,
          });
          if (ok) closeEditDebtModal();
        }}
        onClose={closeEditDebtModal}
      />
    </div>
  );
};

export default Finance;
