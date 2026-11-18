import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useFinanceLogic } from "./useFinanceLogic";
import { FinanceHeader } from "./components/FinanceHeader";
import { FinanceStats } from "./components/FinanceStats";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { SearchBar } from "./components/SearchBar";
import { FolderView } from "./components/FolderView";
import { ListView } from "./components/ListView";
import { DetailsPanel } from "./components/DetailsPanel";
import { PaymentModal } from "./components/PaymentModal";
import { MyDebtModal, type MyDebtFormData } from "./components/MyDebtModal";
import { EditDebtModal } from "./components/EditDebtModal";
import type { DateOrder } from "./sortByDate";
import type { ViewMode, FinanceSource, FinanceRecord, Debt } from "./types";
import {
  MY_DEBTS_ADMIN_ID,
  VALYUTCHIK_ADMIN_ID,
  debtAdminId,
  paymentTypeFor,
} from "./personLedger";

// Which kind of debt the "Қарз қўшиш" modal creates:
// admin null = the tab's own kind (qarzlarim on Қарзларим, valyutchik on Валютчик);
// choice = let the user pick "Абдуманнон олди" (qarzlarim) or "Абдуманнон берди" (client debt)
interface DebtTarget {
  admin: "qarzlarim" | "qarzdorlar" | null;
  choice: boolean;
  fromHeader: boolean;
}

const today = () => new Date().toISOString().split("T")[0];

const emptyDebtForm = (): MyDebtFormData => ({
  lender: "",
  amount: "",
  comment: "",
  isReturned: false,
  date: today(),
  kind: "took",
});

const Finance: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  // "Сана" off (default) = newest first, on = oldest first; applies to every list on the page
  const [dateOrder, setDateOrder] = useState<DateOrder>("desc");
  const [source, setSource] = useState<FinanceSource>("wagons");
  const [showMyDebtModal, setShowMyDebtModal] = useState(false);
  const [debtTarget, setDebtTarget] = useState<DebtTarget>({
    admin: null,
    choice: false,
    fromHeader: false,
  });
  const [myDebtForm, setMyDebtForm] = useState<MyDebtFormData>(emptyDebtForm);
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
    ledgerPersons,
    isClientWithPayments,
  } = useFinanceLogic(source);

  const isMyTab = source === "myDebts" || source === "valyutchik";
  // A lender's payments are read "income = Абдуманнон paid" (see personLedger.ts)
  const personIsLender = source === "valyutchik" || !!selectedPersonData?.isLender;

  // A new payment defaults to the usual direction of the tab: on Қарздорлар / Вагонлар
  // the other person pays, on Қарзларим / Валютчик Абдуманнон pays
  const getDefaultPaymentForm = () => ({
    amount: "",
    description: "",
    type: paymentTypeFor(isMyTab, personIsLender),
    category: personIsLender ? "my_debt" : "sales",
    date: today(),
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
    // Only my own debts (qarzlarim / valyutchik) can be edited
    const admin = debtAdminId(debt);
    if (admin !== MY_DEBTS_ADMIN_ID && admin !== VALYUTCHIK_ADMIN_ID) return;

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

  const openDebtModal = (target: DebtTarget, form: Partial<MyDebtFormData> = {}) => {
    setDebtTarget(target);
    setMyDebtForm({ ...emptyDebtForm(), ...form });
    setShowMyDebtModal(true);
  };

  const closeDebtModal = () => {
    setShowMyDebtModal(false);
    setDebtTarget({ admin: null, choice: false, fromHeader: false });
    setMyDebtForm(emptyDebtForm());
  };

  // A client (no qarzlarim debts) gets client debts only, on either tab
  const shouldShowPulQoshish =
    !!selectedPersonData &&
    (source === "debts" || (source === "myDebts" && !selectedPersonData.isLender));

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // After a change the open person may now belong on the other tab: close their page and say where they went
  useEffect(() => {
    if (loading || !selectedPerson || selectedPersonData) return;
    if (source !== "debts" && source !== "myDebts") return;
    const moved = ledgerPersons.find((person) => person.name === selectedPerson);
    setSelectedPerson(null);
    if (moved?.side && moved.side !== source) {
      toast.info(
        `${selectedPerson} → ${moved.side === "debts" ? "Қарздорлар" : "Қарзларим"} бўлимига ўтди`
      );
    }
  }, [loading, selectedPerson, selectedPersonData, source, ledgerPersons, setSelectedPerson]);

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
        onAddMyDebt={() => openDebtModal({ admin: null, choice: false, fromHeader: true })}
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
        dateOrder={dateOrder}
        onDateOrderToggle={() => setDateOrder((order) => (order === "asc" ? "desc" : "asc"))}
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
            dateOrder={dateOrder}
          />
        )
      ) : (
      <ListView
        wagons={wagons}
        debts={debts}
        source={source}
        dateOrder={dateOrder}
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
          dateOrder={dateOrder}
          onAddPayment={openCreatePaymentModal}
          onAddDebt={
            source === "debts" || source === "myDebts" || source === "valyutchik"
              ? () => {
                  const lender = selectedPerson || "";
                  if (source === "valyutchik") {
                    openDebtModal({ admin: null, choice: false, fromHeader: false }, { lender });
                  } else if (selectedPersonData.isLender) {
                    // A lender can get either kind; default to the tab's usual one
                    openDebtModal(
                      { admin: null, choice: true, fromHeader: false },
                      { lender, kind: source === "myDebts" ? "took" : "gave" }
                    );
                  } else {
                    // A client only gets client debts, so his earlier payments keep their meaning
                    openDebtModal({ admin: "qarzdorlar", choice: false, fromHeader: false }, { lender });
                  }
                }
              : undefined
          }
          onAddMyDebtFromDebts={() =>
            openDebtModal(
              { admin: "qarzdorlar", choice: false, fromHeader: false },
              { lender: selectedPerson || "" }
            )
          }
          showPulQoshish={shouldShowPulQoshish}
          onDeleteWagon={handleDeleteWagon}
          onDeleteFinanceRecord={handleDeleteFinanceRecord}
          onDeleteDebt={handleDeleteDebt}
          onEditDebt={openEditDebtModal}
          source={source}
          onBackToOverview={() => setSelectedPerson(null)}
          onEditFinanceRecord={openEditPaymentModal}
          onSaveSheetDebt={(debt, update) =>
            handleUpdateMyDebt(debt, { amount: update.amount, comment: update.rawItems.join("|") })
          }
          onSaveSheetPayment={(record, draft) =>
            handleReplaceFinanceRecord(record.id, selectedPerson || "", {
              amount: String(draft.amount),
              description: draft.description,
              type: record.type,
              category: record.category,
              date: draft.date,
            })
          }
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
            // The record keeps its category, so it is read the same way after the edit
            const success = await handleReplaceFinanceRecord(
              editingFinanceRecord.id,
              selectedPerson || "",
              formData
            );

            if (success) {
              setEditingFinanceRecord(null);
            }
            return;
          }

          const category = personIsLender
            ? "my_debt"
            : !formData.category || formData.category === "my_debt"
            ? "sales"
            : formData.category;
          const success = await handleAddPayment(selectedPerson || "", { ...formData, category });

          // Mark my own debts returned once Абдуманнон has paid them off
          if (success && personIsLender && selectedPersonData) {
            const amount = parseFloat(formData.amount || "0") || 0;
            const fromMe = formData.type === "income";
            const delta = fromMe ? amount : -amount;
            const myAdmin = source === "valyutchik" ? VALYUTCHIK_ADMIN_ID : MY_DEBTS_ADMIN_ID;
            const paidOff =
              source === "valyutchik"
                ? selectedPersonData.paidAmount + delta >= selectedPersonData.totalAmount
                : (selectedPersonData.balance ?? 0) + delta >= 0;
            if (paidOff) {
              await markDebtsReturned(
                (selectedPersonData.debts || []).filter((debt) => debtAdminId(debt) === myAdmin)
              );
            }
          }
        }}
        onClose={closePaymentModal}
        hideCategory={isMyTab || personIsLender}
        incomeIsFromMe={personIsLender}
        title={editingFinanceRecord ? "Moliya yozuvini tahrirlash" : undefined}
        submitLabel={editingFinanceRecord ? "Yangilash" : undefined}
      />

      <MyDebtModal
        isOpen={showMyDebtModal}
        formData={myDebtForm}
        kindChoice={debtTarget.choice}
        onFormChange={(data) => setMyDebtForm({ ...myDebtForm, ...data })}
        onSubmit={async () => {
          const admin = debtTarget.choice
            ? myDebtForm.kind === "took"
              ? MY_DEBTS_ADMIN_ID
              : "qarzdorlar"
            : debtTarget.admin;

          // Turning a client with payments into a lender would flip how his payments are read
          if (
            debtTarget.fromHeader &&
            source === "myDebts" &&
            isClientWithPayments(myDebtForm.lender)
          ) {
            toast.error(
              `«${myDebtForm.lender.trim()}» мижоз сифатида бор. Унинг саҳифасини очиб, тўловни «Клиент берди» деб қўшинг.`
            );
            return;
          }

          await handleAddMyDebt(
            myDebtForm.lender,
            Number(myDebtForm.amount),
            myDebtForm.comment,
            myDebtForm.isReturned,
            myDebtForm.date,
            admin || undefined
          );
          closeDebtModal();
        }}
        onClose={closeDebtModal}
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
