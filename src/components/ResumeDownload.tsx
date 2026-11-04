"use client";

import { ArrowUpRight, Download, FileText, ShieldCheck, X } from "lucide-react";
import { resumes } from "@/data/resumes";
import { profile } from "@/data/portfolio";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ResumeDownload({ className = "portfolio-text-link", label = "Download résumé", showIcon = true }: { className?: string; label?: string; showIcon?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {label} {showIcon && <Download size={16} aria-hidden="true" />}
        </button>
      </DialogTrigger>
      <DialogContent data-lenis-prevent>
        <header className="resume-dialog-header">
          <div>
            <DialogTitle className="resume-dialog-title">Download résumé</DialogTitle>
            <DialogDescription className="resume-dialog-description">Choose the version that fits your role.</DialogDescription>
          </div>
          <DialogClose className="resume-dialog-close" aria-label="Close resume selector"><X size={18} aria-hidden="true" /></DialogClose>
        </header>
        <div className="resume-list-label" aria-hidden="true">
          <span>Available versions <span className="resume-count">05</span></span>
          <span>PDF · 1 page each</span>
        </div>
        <ul className="resume-options" aria-label="Resume versions">
          {resumes.map(({ role, focus, file }) => (
            <li key={file}><a href={`/resumes/${file}`} download={file} aria-label={`Download ${role} resume`}>
              <span className="resume-file-icon" aria-hidden="true"><FileText size={19} strokeWidth={1.5} /></span>
              <span className="resume-file-copy"><span className="resume-file-title">{role}</span><span className="resume-file-description">{focus}</span></span>
              <span className="resume-file-action" aria-hidden="true"><Download size={17} strokeWidth={1.7} /></span>
            </a></li>
          ))}
        </ul>
        <footer className="resume-dialog-footer">
          <span><ShieldCheck size={14} aria-hidden="true" />Contact details redacted</span>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn <ArrowUpRight size={14} aria-hidden="true" /></a>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
