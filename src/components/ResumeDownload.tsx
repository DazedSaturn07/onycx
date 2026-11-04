"use client";

import { useId, useRef } from "react";
import { Download, X } from "lucide-react";
import { resumes } from "@/data/resumes";

export default function ResumeDownload({ className = "portfolio-text-link", label = "Download résumé", showIcon = true }: { className?: string; label?: string; showIcon?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {label} {showIcon && <Download size={16} aria-hidden="true" />}
      </button>
      <dialog ref={dialog} className="resume-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} data-lenis-prevent onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }
      }}>
        <div className="resume-dialog-heading">
          <p className="resume-dialog-kicker">Find the right fit</p>
          <button type="button" className="resume-dialog-close" aria-label="Close resume selector" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
        </div>
        <h2 id={titleId}>Choose a résumé.</h2>
        <p id={descriptionId}>Five roles. One click to download a PDF.</p>
        <ul className="resume-options">
          {resumes.map(({ role, file }) => (
            <li key={file}><a href={`/resumes/${file}`} download={file}>
              <span>{role}<small>PDF · 1 page</small></span>
              <Download size={20} aria-label="Download" />
            </a></li>
          ))}
        </ul>
        <p className="resume-dialog-note">Personal contact details are redacted. Connect through LinkedIn or Instagram.</p>
      </dialog>
    </>
  );
}
