\# Role Permissions Matrix (V1)

Project: \*\*Yiba Verified – Compliance & QCTO Oversight Platform\*\*    
Version: \*\*v1.0\*\*    
Date: \*\*2026-01-14\*\*

\---

\#\# 🔐 Permission Model Principles

\- \*\*Deny by default\*\*: If a permission is not explicitly granted, it is denied.  
\- \*\*Institution-scoped access\*\*: Institution users can only access their own data.  
\- \*\*Read-only enforcement\*\* for QCTO users.  
\- \*\*No hard deletes\*\* anywhere in the system.  
\- \*\*All actions are audit-logged\*\* (except pure read operations).

\---

\#\# 👤 Core System Roles

\- \*\*PLATFORM\_ADMIN\*\*  
\- \*\*QCTO\_USER\*\*  
\- \*\*INSTITUTION\_ADMIN\*\*  
\- \*\*INSTITUTION\_STAFF\*\*  
\- \*\*STUDENT\*\*

\---

\#\# 🔑 Authentication & Profile

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |  
| View Profile | ✅ | ✅ | ✅ | ✅ | ✅ |  
| Edit Profile | ✅ | ✅ | ✅ | ✅ | ❌ |  
| Change Password | ✅ | ✅ | ✅ | ✅ | ✅ |

\---

\#\# 🏫 Institution Management

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| View Institution Profile | ✅ | 👁️ (All) | 👁️ (Own) | 👁️ (Own) | ❌ |  
| Edit Institution Profile | ✅ | ❌ | ✏️ (Own) | ❌ | ❌ |  
| Approve / Reject Institution | ✅ | ❌ | ❌ | ❌ | ❌ |  
| Suspend Institution | ✅ | ❌ | ❌ | ❌ | ❌ |

\---

\#\# 👥 Staff & Role Management

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| View Staff Users | ✅ | ❌ | 👁️ (Own) | ❌ | ❌ |  
| Invite Staff User | ✅ | ❌ | ✏️ (Own) | ❌ | ❌ |  
| Assign Roles | ✅ | ❌ | ✏️ (Limited) | ❌ | ❌ |  
| Deactivate Staff User | ✅ | ❌ | ✏️ (Own) | ❌ | ❌ |

\---

\#\# 📄 Programme Delivery Readiness (Form 5\)

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| View Readiness Data | ✅ | 👁️ (All) | 👁️ (Own) | 👁️ (Own) | ❌ |  
| Capture / Edit Readiness | ✅ | ❌ | ✏️ (Own) | ✏️ (Assigned) | ❌ |  
| Upload Evidence | ✅ | ❌ | ✏️ (Own) | ✏️ (Assigned) | ❌ |  
| Submit for Review | ✅ | ❌ | ✏️ | ❌ | ❌ |  
| Review & Flag Evidence | ❌ | ✏️ | ❌ | ❌ | ❌ |  
| Record Recommendation | ❌ | ✏️ | ❌ | ❌ | ❌ |

\---

\#\# 📁 Evidence & Document Vault

⚠️ \*\*Documents are never deleted — only versioned\*\*

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| View Documents | ✅ | 👁️ (All) | 👁️ (Own) | 👁️ (Own) | ❌ |  
| Upload Documents | ✅ | ❌ | ✏️ (Own) | ✏️ (Assigned) | ❌ |  
| Replace Documents (New Version) | ✅ | ❌ | ✏️ (Own) | ✏️ (Assigned) | ❌ |  
| Delete Documents | ❌ | ❌ | ❌ | ❌ | ❌ |

\---

\#\# 🎓 Learner Management (LMIS)

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| View Learners | ✅ | 👁️ (All) | 👁️ (Own) | 👁️ (Own) | 👁️ (Self) |  
| Create Learner | ✅ | ❌ | ✏️ | ✏️ (Assigned) | ❌ |  
| Edit Learner | ✅ | ❌ | ✏️ | ✏️ (Assigned) | ❌ |  
| Archive Learner | ✅ | ❌ | ✏️ | ❌ | ❌ |

\---

\#\# 🧾 Enrolments & Attendance

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| Create Enrolment | ✅ | ❌ | ✏️ | ✏️ (Assigned) | ❌ |  
| Edit Enrolment Status | ✅ | ❌ | ✏️ | ❌ | ❌ |  
| Capture Attendance | ✅ | ❌ | ✏️ | ✏️ | ❌ |  
| View Attendance | ✅ | 👁️ | 👁️ | 👁️ | 👁️ (Self) |

\---

\#\# 📊 Readiness & EISA

| Feature | Platform Admin | QCTO User | Institution Admin | Institution Staff | Student |  
|------|------|------|------|------|------|  
| Capture Rea

