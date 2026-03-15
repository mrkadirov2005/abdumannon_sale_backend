import { useEffect, useState, type JSX } from "react";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useSelector } from "react-redux";
import { getAuthFromStore } from "../../redux/selectors";
import { toast } from "react-toastify";
import { Download, Upload, Share2, RefreshCw, ChevronDown, ChevronUp, Loader, Cloud } from "lucide-react";

type BackupTableRow = Record<string, unknown>;

type BackupData = { 
    meta?: { 
        created_at?: string; 
        table_count?: number;
    };
    data: Record<string, BackupTableRow[]>;
};

export default function DatabaseBackup(): JSX.Element {
    const authData = useSelector(getAuthFromStore);
    const [backupData, setBackupData] = useState<BackupData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [expandedTable, setExpandedTable] = useState<string | null>(null);

    // Fetch backup preview (without download)
    const fetchBackupPreview = async (): Promise<void> => {
        setLoading(true);
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.backup}`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${authData.accessToken}`,
                },
            });
            const text = await res.text();
            const json: BackupData = JSON.parse(text);
            setBackupData(json);
            toast.success("✅ Бацкуп превиев юкланди");
        } catch (err) {
            console.error(err);
            toast.error("❌ Бацкуп превиев юкланмади");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackupPreview();
    }, []);

    // Download backup JSON file
    const downloadBackup = async (): Promise<void> => {
        const toastId = toast.loading("⏳Downloading backup...");
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.backup}`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${authData.accessToken}`,
                },
            });
            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `db-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
            toast.update(toastId, { render: "✅ Backup downloaded successfully", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error(error);
            toast.update(toastId, { render: "❌ Failed to download backup", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const downloadSqlBackup = async (): Promise<void> => {
        const toastId = toast.loading("⏳ Downloading SQL dump...");
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.backupSql}`, {
                method: "POST",
                headers: {
                    "Authorization": `${authData.accessToken}`,
                },
            });

            if (!res.ok) {
                const error = await res.json().catch(() => null);
                throw new Error(error?.message || "Failed to download SQL dump");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `db-backup-${Date.now()}.sql`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
            toast.update(toastId, { render: "✅ SQL dump downloaded successfully", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error: any) {
            console.error(error);
            toast.update(toastId, { render: `❌ Failed to download SQL dump: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    // Backup to Google Sheets via Apps Script
    const backupToGoogleSheets = async (): Promise<void> => {
        if (!backupData) {
            toast.warning("⚠️ No backup data available to send to Google Sheets");
            return;
        }

        const toastId = toast.loading("⏳ Sending backup to Google Sheets...");
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.backuptoGoogleSheets}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${authData.accessToken}`,
                },
                body: JSON.stringify({
                    data: backupData.data
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result?.message || "Google Sheets backup failed");
            }

            toast.update(toastId, { render: "✅ Backup successfully sent to Google Sheets", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err: any) {
            console.error(err);
            toast.update(toastId, { render: `❌ Failed to backup to Google Sheets: ${err.message}`, type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    // Backup to Google Drive
    const backupToGoogleDrive = async (): Promise<void> => {
        const toastId = toast.loading("⏳ Sending backup to Google Drive...");
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}/api/backup/manual-backup-drive`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${authData.accessToken}`,
                },
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result?.message || "Google Drive backup failed");
            }

            toast.update(toastId, { 
                render: `✅ Backup successfully sent to Google Drive!\n📁 File: ${result.data?.timestamp}`, 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
        } catch (err: any) {
            console.error(err);
            toast.update(toastId, { render: `❌ Failed to backup to Google Drive: ${err.message}`, type: "error", isLoading: false, autoClose: 3000 });
        }
    };


    // Restore backup from file
    const restoreBackup = async (file: File | null): Promise<void> => {
        if (!file) return;

        try {
            const text = await file.text();
            const json: BackupData = JSON.parse(text);

            const confirmRestore = window.confirm(
                "This will DELETE existing data and restore backup. Continue?"
            );
            if (!confirmRestore) return;

            await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.restore}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `${authData.accessToken}`,
                },
                body: JSON.stringify(json)
            });

            alert("Датабасе ресторед суццессфуллй");
            fetchBackupPreview();
        } catch (err) {
            console.error(err);
            alert("Ресторе фаилед");
        }
    };

    const restoreSqlBackup = async (file: File | null): Promise<void> => {
        if (!file) return;

        try {
            const confirmRestore = window.confirm(
                "This will DELETE existing data according to the SQL dump and restore the database. Continue?"
            );
            if (!confirmRestore) return;

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.restoreSql}`, {
                method: "POST",
                headers: {
                    "Authorization": `${authData.accessToken}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json().catch(() => null);
                throw new Error(error?.message || "SQL restore failed");
            }

            alert("SQL dump restored successfully");
            fetchBackupPreview();
        } catch (err) {
            console.error(err);
            alert("SQL restore failed");
        }
    };

    if (loading) {
        return <p className="text-center text-gray-500">Нусха юкланмоқда</p>;
    }

    if (!backupData) {
        return <p className="text-center text-red-500">Нусха ёқ</p>;
    }

    const tables = backupData.data;

    // Restore from Google Sheets
    const restoreFromGoogleSheets = async (): Promise<void> => {
        const toastId = toast.loading("⏳ Downloading backup from  Google sheets...");
        setLoading(true);
        try {
            const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.backup.restoreFromSheets}`, {
                method: "POST",
                headers: {
                    "Authorization": `${authData.accessToken}`,
                },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to fetch backup from Google Sheets");
            }

            // Handle file download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Get filename from headers or use default
            let filename = "sheets-backup.json";
            const contentDisposition = res.headers.get("Content-Disposition");
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }
            
            // Create download link and trigger click
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            
            toast.update(toastId, { render: `✅ Backup downloaded: ${filename}`, type: "success", isLoading: false, autoClose: 3000 });
        } catch (err: any) {
            console.error(err);
            toast.update(toastId, { render: `❌ Failed: ${err.message || "Unknown error"}`, type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">📦 Датабасе Бацкуп Манагер</h1>
                    <p className="text-gray-600">Манаге ёур датабасе бацкупс анд сйнц витҳ Гоогле Шеец</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <button
                        onClick={downloadBackup}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Download size={20} />}
                        Довнлоад Бацкуп
                    </button>

                    <button
                        onClick={downloadSqlBackup}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Download size={20} />}
                        SQL Думп
                    </button>

                    <label className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl cursor-pointer">
                        <Upload size={20} />
                        Ресторе Бацкуп
                        <input
                            type="file"
                            accept="application/json"
                            hidden
                            onChange={(e) => restoreBackup(e.target.files?.[0] ?? null)}
                        />
                    </label>

                    <label className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl cursor-pointer">
                        <Upload size={20} />
                        Ресторе SQL
                        <input
                            type="file"
                            accept=".sql,text/plain"
                            hidden
                            onChange={(e) => restoreSqlBackup(e.target.files?.[0] ?? null)}
                        />
                    </label>

                    <button
                        onClick={backupToGoogleSheets}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Share2 size={20} />}
                        Бацкуп то Гоогле Шеец
                    </button>

                    <button
                        onClick={restoreFromGoogleSheets}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw size={20} />}
                        Ресторе фром Шеец
                    </button>

                    <button
                        onClick={backupToGoogleDrive}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Cloud size={20} />}
                        Гоогле Драйв
                    </button>
                </div>

                {/* Tables Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(tables).map((table) => (
                        <div
                            key={table}
                            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="font-semibold text-lg text-gray-900">{table}</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        📊 {tables[table].length} ровс
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setExpandedTable(
                                            expandedTable === table ? null : table
                                        )
                                    }
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {expandedTable === table ? (
                                        <ChevronUp className="text-blue-600" size={24} />
                                    ) : (
                                        <ChevronDown className="text-gray-600" size={24} />
                                    )}
                                </button>
                            </div>

                            {/* Preview Table */}
                            {expandedTable === table && tables[table].length > 0 && (
                                <div className="overflow-x-auto border-t pt-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                {Object.keys(tables[table][0]).map(
                                                    (col) => (
                                                        <th
                                                            key={col}
                                                            className="px-4 py-3 text-left font-medium text-gray-700"
                                                        >
                                                            {col}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tables[table].slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-b hover:bg-gray-50">
                                                    {Object.values(row).map((val, j) => (
                                                        <td
                                                            key={j}
                                                            className="px-4 py-3 text-gray-600"
                                                        >
                                                            {String(val).length > 50
                                                                ? String(val).substring(0, 50) + "..."
                                                                : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {tables[table].length > 5 && (
                                        <p className="text-xs text-gray-500 mt-3 text-center">
                                            📌 Шовинг фирст 5 ровс оф {tables[table].length} тотал
                                        </p>
                                    )}
                                </div>
                            )}

                            {expandedTable === table && tables[table].length === 0 && (
                                <div className="text-center py-6 border-t">
                                    <p className="text-gray-500">Но дата ин тҳис табле</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
