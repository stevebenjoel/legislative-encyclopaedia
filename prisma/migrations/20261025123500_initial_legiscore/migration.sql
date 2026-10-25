-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('PLATFORM', 'NATIONAL_ASSEMBLY', 'SENATE', 'HOUSE_OF_REPRESENTATIVES', 'STATE_ASSEMBLY', 'CIVIL_SOCIETY', 'RESEARCH_ORGANISATION', 'EDUCATIONAL_INSTITUTION');

-- CreateEnum
CREATE TYPE "ChamberCode" AS ENUM ('SENATE', 'HOUSE', 'JOINT', 'NONE');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LEGISLATOR', 'LEGISLATIVE_CLERK', 'COMMITTEE_CHAIRPERSON', 'COMMITTEE_SECRETARY', 'LEGISLATIVE_RESEARCHER', 'LEGAL_ADVISER', 'POLICY_ANALYST', 'ACADEMY_INSTRUCTOR', 'ACADEMY_STUDENT', 'CIVIL_SOCIETY_REPRESENTATIVE', 'REGISTERED_CITIZEN', 'DATA_VERIFICATION_OFFICER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PROVISIONAL', 'UNVERIFIED', 'DISPUTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('PUBLIC', 'REGISTERED', 'INSTITUTIONAL', 'RESTRICTED', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('ORDINARY', 'SECTION_59_MONEY', 'SECTION_9_CONSTITUTION_ALTERATION', 'SECTION_8_STATE_CREATION_OR_BOUNDARY');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'REGISTERED', 'IN_PROGRESS', 'PASSED_ORIGINATING_CHAMBER', 'AWAITING_CONCURRENCE', 'HARMONISATION', 'PRESENTED_FOR_ASSENT', 'ASSENTED', 'ASSENT_WITHHELD', 'ENACTMENT_VERIFIED', 'NEGATIVED', 'WITHDRAWN', 'LAPSED');

-- CreateEnum
CREATE TYPE "LegislativeEventType" AS ENUM ('REGISTERED', 'NOTICE_PUBLISHED', 'FIRST_READING', 'SECOND_READING_PASSED', 'SECOND_READING_NEGATIVED', 'COMMITTEE_REFERRED', 'HEARING_SCHEDULED', 'HEARING_HELD', 'COMMITTEE_REPORT_SUBMITTED', 'COMMITTEE_OF_WHOLE_CONSIDERED', 'REPORT_ADOPTED', 'THIRD_READING_PASSED', 'THIRD_READING_NEGATIVED', 'TRANSMITTED_TO_OTHER_CHAMBER', 'CONCURRENCE_RECORDED', 'CONFERENCE_REQUESTED', 'CONFERENCE_REPORT_ADOPTED', 'ENGROSSED', 'PRESENTED_FOR_ASSENT', 'ASSENT_GRANTED', 'ASSENT_WITHHELD', 'VETO_OVERRIDE_PASSED', 'ENACTMENT_VERIFIED', 'WITHDRAWN', 'LAPSED', 'RECOMMITTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONSTITUTION', 'CONSTITUTIONAL_ALTERATION', 'ACT', 'BILL', 'STANDING_ORDER', 'COMMITTEE_REPORT', 'HANSARD', 'ORDER_PAPER', 'VOTES_AND_PROCEEDINGS', 'JUDICIAL_DECISION', 'POLICY_DOCUMENT', 'RESEARCH_PUBLICATION', 'EVIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'RETURNED_FOR_CORRECTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED_FOR_REVIEW', 'REVIEW_IN_PROGRESS', 'CORRECTIONS_REQUESTED', 'RESUBMITTED', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AIArtifactType" AS ENUM ('BILL', 'MOTION', 'DEBATE_BRIEF', 'CONSTITUTIONAL_ANALYSIS', 'BILL_SCRUTINY', 'RESEARCH_BRIEF', 'COMMITTEE_REPORT', 'OVERSIGHT_QUESTIONS', 'DOCUMENT_COMPARISON');

-- CreateEnum
CREATE TYPE "AIReviewDecision" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CorrespondenceDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "description" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamber" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" "ChamberCode" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Chamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblySession" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AssemblySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "appwriteUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'INVITED',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "scopes" JSONB,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "title" TEXT,
    "chamber" "ChamberCode" NOT NULL,
    "officialId" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "longTitle" TEXT,
    "classification" "BillType" NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "explanatoryMemorandum" TEXT,
    "policyObjectives" TEXT,
    "financialImplications" TEXT,
    "introducedOn" TIMESTAMP(3),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillSponsor" (
    "billId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BillSponsor_pkey" PRIMARY KEY ("billId","sponsorId")
);

-- CreateTable
CREATE TABLE "BillVersion" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "contentText" TEXT,
    "sourceDocumentId" TEXT,
    "integrityHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegislativeEvent" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "recorderId" TEXT NOT NULL,
    "eventType" "LegislativeEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "standingOrderId" TEXT,
    "auditReference" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegislativeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEvidence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "EventEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "publisher" TEXT,
    "sourceUrl" TEXT,
    "publicationDate" TIMESTAMP(3),
    "retrievalDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'PUBLIC',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageFileId" TEXT,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "integrityHash" TEXT NOT NULL,
    "extractedText" TEXT,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandingOrderEdition" (
    "id" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'PROVISIONAL',
    "sourceUrl" TEXT,

    CONSTRAINT "StandingOrderEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleDefinition" (
    "id" TEXT NOT NULL,
    "standingOrderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "effects" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RuleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleApproval" (
    "id" TEXT NOT NULL,
    "ruleDefinitionId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "RuleApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "chamberId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mandate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "referralDate" TIMESTAMP(3) NOT NULL,
    "referralAuthority" TEXT NOT NULL,
    "termsOfReference" TEXT,
    "expectedReportDate" TIMESTAMP(3),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hearing" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "referralId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "publicNotice" TEXT,
    "status" TEXT NOT NULL,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Hearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "hearingId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "submitterName" TEXT NOT NULL,
    "submitterType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "consentRecorded" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeReport" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "referralId" TEXT,
    "title" TEXT NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "minorityOpinion" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "clauseReference" TEXT NOT NULL,
    "proposedText" TEXT NOT NULL,
    "rationale" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChamberVote" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "chamber" "ChamberCode" NOT NULL,
    "motion" TEXT NOT NULL,
    "heldOn" TIMESTAMP(3) NOT NULL,
    "votesFor" INTEGER,
    "votesAgainst" INTEGER,
    "abstentions" INTEGER,
    "result" TEXT NOT NULL,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "ChamberVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issues" TEXT,
    "harmonisedText" TEXT,
    "agreementStatus" TEXT NOT NULL,
    "senateAdoptedOn" TIMESTAMP(3),
    "houseAdoptedOn" TIMESTAMP(3),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConferenceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationForAssent" (
    "id" TEXT NOT NULL,
    "billReference" TEXT NOT NULL,
    "presentedOn" TIMESTAMP(3) NOT NULL,
    "documentReference" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "PresentationForAssent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssentDecision" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedOn" TIMESTAMP(3),
    "notes" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "AssentDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActRecord" (
    "id" TEXT NOT NULL,
    "assentDecisionId" TEXT NOT NULL,
    "actNumber" TEXT,
    "title" TEXT NOT NULL,
    "commencementDate" TIMESTAMP(3),
    "gazetteReference" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "ActRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "responsibleMda" TEXT,
    "description" TEXT,

    CONSTRAINT "PolicyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "policyProgramId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "framework" JSONB NOT NULL,
    "findings" JSONB,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "policyProgramId" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "mda" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appropriated" DECIMAL(18,2) NOT NULL,
    "released" DECIMAL(18,2),
    "utilised" DECIMAL(18,2),

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MDAMonitoringRecord" (
    "id" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "mda" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportingDate" TIMESTAMP(3) NOT NULL,
    "progress" DECIMAL(5,2),
    "findings" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "MDAMonitoringRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssessment" (
    "id" TEXT NOT NULL,
    "billId" TEXT,
    "assessmentType" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "billId" TEXT,
    "aiAssessmentId" TEXT,
    "locator" TEXT NOT NULL,
    "quotation" TEXT,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "institutionId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "content" TEXT,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "passMark" INTEGER NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDocument" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceDocumentId" TEXT,
    "type" "AIArtifactType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDraftingSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "billId" TEXT,
    "outputDocumentId" TEXT,
    "taskType" "AIArtifactType" NOT NULL,
    "inputs" JSONB NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDraftingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResearchBrief" (
    "id" TEXT NOT NULL,
    "aiDocumentId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "sourcesRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AIResearchBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReview" (
    "id" TEXT NOT NULL,
    "aiDocumentId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "AIReviewDecision" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AIReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegislativeMetric" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "publishedValue" DECIMAL(18,4),
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "methodologyNote" TEXT,

    CONSTRAINT "LegislativeMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricObservation" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "billId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "exclusions" JSONB,

    CONSTRAINT "MetricObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCoverageRecord" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "eligibleRecords" INTEGER NOT NULL,
    "includedRecords" INTEGER NOT NULL,
    "missingRecords" INTEGER NOT NULL,
    "limitations" TEXT,

    CONSTRAINT "DataCoverageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "chamber" "ChamberCode" NOT NULL,
    "state" TEXT,
    "constituency" TEXT,
    "legislativeTerm" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeActivity" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "CommitteeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "methodology" JSONB NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceCorrection" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "previousValue" JSONB NOT NULL,
    "correctedValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "committeeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "WorkflowPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueAt" TIMESTAMP(3),
    "completionEvidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "committeeId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "virtualLink" TEXT,
    "agenda" JSONB,
    "isOfficialSitting" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'INSTITUTIONAL',

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attended" BOOLEAN,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMinutes" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "recorderId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "MeetingMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentApproval" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correspondence" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "direction" "CorrespondenceDirection" NOT NULL,
    "subject" TEXT NOT NULL,
    "classification" "AccessLevel" NOT NULL DEFAULT 'INSTITUTIONAL',
    "receivedOrSentAt" TIMESTAMP(3) NOT NULL,
    "responseDueAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Correspondence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentWorkspace" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DepartmentWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalPermission" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InstitutionalPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chamber_institutionId_code_key" ON "Chamber"("institutionId", "code");

-- CreateIndex
CREATE INDEX "AssemblySession_institutionId_isCurrent_idx" ON "AssemblySession"("institutionId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "User_appwriteUserId_key" ON "User"("appwriteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RoleAssignment_institutionId_role_idx" ON "RoleAssignment"("institutionId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_institutionId_role_key" ON "RoleAssignment"("userId", "institutionId", "role");

-- CreateIndex
CREATE INDEX "Bill_status_verification_idx" ON "Bill"("status", "verification");

-- CreateIndex
CREATE INDEX "Bill_title_idx" ON "Bill"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_chamberId_sessionId_billNumber_key" ON "Bill"("chamberId", "sessionId", "billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BillVersion_billId_versionNumber_key" ON "BillVersion"("billId", "versionNumber");

-- CreateIndex
CREATE INDEX "LegislativeEvent_billId_eventDate_idx" ON "LegislativeEvent"("billId", "eventDate");

-- CreateIndex
CREATE INDEX "LegislativeEvent_eventType_verification_idx" ON "LegislativeEvent"("eventType", "verification");

-- CreateIndex
CREATE UNIQUE INDEX "EventEvidence_eventId_sourceDocumentId_key" ON "EventEvidence"("eventId", "sourceDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_documentId_key" ON "SourceDocument"("documentId");

-- CreateIndex
CREATE INDEX "SourceDocument_type_verification_idx" ON "SourceDocument"("type", "verification");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_sourceDocumentId_versionNumber_key" ON "DocumentVersion"("sourceDocumentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StandingOrderEdition_chamberId_edition_key" ON "StandingOrderEdition"("chamberId", "edition");

-- CreateIndex
CREATE UNIQUE INDEX "RuleDefinition_standingOrderId_code_key" ON "RuleDefinition"("standingOrderId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_institutionId_slug_key" ON "Committee"("institutionId", "slug");

-- CreateIndex
CREATE INDEX "Referral_committeeId_expectedReportDate_idx" ON "Referral"("committeeId", "expectedReportDate");

-- CreateIndex
CREATE UNIQUE INDEX "ActRecord_assentDecisionId_key" ON "ActRecord"("assentDecisionId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_fiscalYear_mda_code_key" ON "BudgetLine"("fiscalYear", "mda", "code");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_courseId_position_key" ON "Lesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_userId_key" ON "Enrollment"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AIConversation_institutionId_ownerId_idx" ON "AIConversation"("institutionId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AIResearchBrief_aiDocumentId_key" ON "AIResearchBrief"("aiDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "AIReview_aiDocumentId_reviewerId_key" ON "AIReview"("aiDocumentId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_institutionId_key_key" ON "MetricDefinition"("institutionId", "key");

-- CreateIndex
CREATE INDEX "LegislativeMetric_institutionId_reportingPeriod_idx" ON "LegislativeMetric"("institutionId", "reportingPeriod");

-- CreateIndex
CREATE INDEX "MetricObservation_metricDefinitionId_periodStart_periodEnd_idx" ON "MetricObservation"("metricDefinitionId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "MemberProfile_institutionId_chamber_fullName_idx" ON "MemberProfile"("institutionId", "chamber", "fullName");

-- CreateIndex
CREATE INDEX "WorkflowTask_institutionId_status_dueAt_idx" ON "WorkflowTask"("institutionId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMinutes_meetingId_key" ON "MeetingMinutes"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_approvalId_position_key" ON "ApprovalStep"("approvalId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Correspondence_institutionId_referenceNumber_key" ON "Correspondence"("institutionId", "referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentWorkspace_institutionId_slug_key" ON "DepartmentWorkspace"("institutionId", "slug");

-- CreateIndex
CREATE INDEX "AuditEvent_institutionId_entityType_entityId_occurredAt_idx" ON "AuditEvent"("institutionId", "entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalPermission_institutionId_key_key" ON "InstitutionalPermission"("institutionId", "key");

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamber" ADD CONSTRAINT "Chamber_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblySession" ADD CONSTRAINT "AssemblySession_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssemblySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSponsor" ADD CONSTRAINT "BillSponsor_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSponsor" ADD CONSTRAINT "BillSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillVersion" ADD CONSTRAINT "BillVersion_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillVersion" ADD CONSTRAINT "BillVersion_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeEvent" ADD CONSTRAINT "LegislativeEvent_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeEvent" ADD CONSTRAINT "LegislativeEvent_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeEvent" ADD CONSTRAINT "LegislativeEvent_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeEvent" ADD CONSTRAINT "LegislativeEvent_standingOrderId_fkey" FOREIGN KEY ("standingOrderId") REFERENCES "StandingOrderEdition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEvidence" ADD CONSTRAINT "EventEvidence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LegislativeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEvidence" ADD CONSTRAINT "EventEvidence_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandingOrderEdition" ADD CONSTRAINT "StandingOrderEdition_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleDefinition" ADD CONSTRAINT "RuleDefinition_standingOrderId_fkey" FOREIGN KEY ("standingOrderId") REFERENCES "StandingOrderEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApproval" ADD CONSTRAINT "RuleApproval_ruleDefinitionId_fkey" FOREIGN KEY ("ruleDefinitionId") REFERENCES "RuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApproval" ADD CONSTRAINT "RuleApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hearing" ADD CONSTRAINT "Hearing_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hearing" ADD CONSTRAINT "Hearing_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_hearingId_fkey" FOREIGN KEY ("hearingId") REFERENCES "Hearing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeReport" ADD CONSTRAINT "CommitteeReport_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeReport" ADD CONSTRAINT "CommitteeReport_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamberVote" ADD CONSTRAINT "ChamberVote_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssentDecision" ADD CONSTRAINT "AssentDecision_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "PresentationForAssent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActRecord" ADD CONSTRAINT "ActRecord_assentDecisionId_fkey" FOREIGN KEY ("assentDecisionId") REFERENCES "AssentDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_policyProgramId_fkey" FOREIGN KEY ("policyProgramId") REFERENCES "PolicyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_policyProgramId_fkey" FOREIGN KEY ("policyProgramId") REFERENCES "PolicyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDAMonitoringRecord" ADD CONSTRAINT "MDAMonitoringRecord_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssessment" ADD CONSTRAINT "AIAssessment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_aiAssessmentId_fkey" FOREIGN KEY ("aiAssessmentId") REFERENCES "AIAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDocument" ADD CONSTRAINT "AIDocument_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDocument" ADD CONSTRAINT "AIDocument_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDraftingSession" ADD CONSTRAINT "AIDraftingSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDraftingSession" ADD CONSTRAINT "AIDraftingSession_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDraftingSession" ADD CONSTRAINT "AIDraftingSession_outputDocumentId_fkey" FOREIGN KEY ("outputDocumentId") REFERENCES "AIDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResearchBrief" ADD CONSTRAINT "AIResearchBrief_aiDocumentId_fkey" FOREIGN KEY ("aiDocumentId") REFERENCES "AIDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReview" ADD CONSTRAINT "AIReview_aiDocumentId_fkey" FOREIGN KEY ("aiDocumentId") REFERENCES "AIDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReview" ADD CONSTRAINT "AIReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDefinition" ADD CONSTRAINT "MetricDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeMetric" ADD CONSTRAINT "LegislativeMetric_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeMetric" ADD CONSTRAINT "LegislativeMetric_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCoverageRecord" ADD CONSTRAINT "DataCoverageRecord_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "MetricObservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeActivity" ADD CONSTRAINT "CommitteeActivity_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceCorrection" ADD CONSTRAINT "PerformanceCorrection_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PerformanceReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "DocumentApproval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correspondence" ADD CONSTRAINT "Correspondence_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentWorkspace" ADD CONSTRAINT "DepartmentWorkspace_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalPermission" ADD CONSTRAINT "InstitutionalPermission_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
