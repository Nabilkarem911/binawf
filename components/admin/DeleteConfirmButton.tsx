"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteConfirmButton({
  action,
  label = "حذف",
  title = "تأكيد الحذف",
  message = "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
}: {
  action: () => Promise<void>;
  label?: string;
  title?: string;
  message?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
      >
        <Trash2 className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-navy animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
