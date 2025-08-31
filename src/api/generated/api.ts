import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const KPIProfitBreakdown = z
  .object({
    labor_profit: z.number(),
    material_profit: z.number(),
    adjustment_profit: z.number(),
  })
  .passthrough()
const KPIJobBreakdown = z
  .object({
    job_id: z.string(),
    job_number: z.string(),
    job_name: z.string(),
    client_name: z.string(),
    billable_hours: z.number(),
    revenue: z.number(),
    cost: z.number(),
    profit: z.number(),
  })
  .passthrough()
const KPIDetails = z
  .object({
    time_revenue: z.number(),
    material_revenue: z.number(),
    adjustment_revenue: z.number(),
    total_revenue: z.number(),
    staff_cost: z.number(),
    material_cost: z.number(),
    adjustment_cost: z.number(),
    total_cost: z.number(),
    profit_breakdown: KPIProfitBreakdown,
    job_breakdown: z.array(KPIJobBreakdown),
  })
  .passthrough()
const KPIDayData = z
  .object({
    date: z.string(),
    day: z.number().int(),
    holiday: z.boolean(),
    holiday_name: z.string().optional(),
    billable_hours: z.number(),
    total_hours: z.number(),
    shop_hours: z.number(),
    shop_percentage: z.number(),
    gross_profit: z.number(),
    color: z.string(),
    gp_target_achievement: z.number(),
    details: KPIDetails,
  })
  .passthrough()
const KPIMonthlyTotals = z
  .object({
    billable_hours: z.number(),
    total_hours: z.number(),
    shop_hours: z.number(),
    gross_profit: z.number(),
    days_green: z.number().int(),
    days_amber: z.number().int(),
    days_red: z.number().int(),
    labour_green_days: z.number().int(),
    labour_amber_days: z.number().int(),
    labour_red_days: z.number().int(),
    profit_green_days: z.number().int(),
    profit_amber_days: z.number().int(),
    profit_red_days: z.number().int(),
    working_days: z.number().int(),
    elapsed_workdays: z.number().int(),
    remaining_workdays: z.number().int(),
    time_revenue: z.number(),
    material_revenue: z.number(),
    adjustment_revenue: z.number(),
    staff_cost: z.number(),
    material_cost: z.number(),
    adjustment_cost: z.number(),
    material_profit: z.number(),
    adjustment_profit: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    elapsed_target: z.number(),
    net_profit: z.number(),
    billable_percentage: z.number(),
    shop_percentage: z.number(),
    avg_daily_gp: z.number(),
    avg_daily_gp_so_far: z.number(),
    avg_billable_hours_so_far: z.number(),
    color_hours: z.string(),
    color_gp: z.string(),
    color_shop: z.string(),
  })
  .passthrough()
const KPIThresholds = z
  .object({
    billable_threshold_green: z.number(),
    billable_threshold_amber: z.number(),
    daily_gp_target: z.number(),
    shop_hours_target: z.number(),
  })
  .passthrough()
const KPICalendarData = z
  .object({
    calendar_data: z.record(KPIDayData),
    monthly_totals: KPIMonthlyTotals,
    thresholds: KPIThresholds,
    year: z.number().int(),
    month: z.number().int(),
  })
  .passthrough()
const StandardError = z.object({ error: z.string(), details: z.unknown().optional() }).passthrough()
const JobAgingFinancialData = z
  .object({
    estimate_total: z.number(),
    quote_total: z.number(),
    actual_total: z.number(),
  })
  .passthrough()
const JobAgingTimingData = z
  .object({
    created_date: z.string(),
    created_days_ago: z.number().int(),
    days_in_current_status: z.number().int(),
    last_activity_date: z.string().datetime({ offset: true }).nullable(),
    last_activity_days_ago: z.number().int().nullable(),
    last_activity_type: z.string().nullish(),
    last_activity_description: z.string().nullish(),
  })
  .passthrough()
const JobAgingJobData = z
  .object({
    id: z.string(),
    job_number: z.number().int(),
    name: z.string(),
    client_name: z.string(),
    status: z.string(),
    status_display: z.string(),
    financial_data: JobAgingFinancialData,
    timing_data: JobAgingTimingData,
  })
  .passthrough()
const JobAgingResponse = z.object({ jobs: z.array(JobAgingJobData) }).passthrough()
const StaffPerformanceTeamAverages = z
  .object({
    billable_percentage: z.number(),
    revenue_per_hour: z.number(),
    profit_per_hour: z.number(),
    jobs_per_person: z.number(),
    total_hours: z.number(),
    billable_hours: z.number(),
    total_revenue: z.number(),
    total_profit: z.number(),
  })
  .passthrough()
const StaffPerformanceJobBreakdown = z
  .object({
    job_id: z.string(),
    job_number: z.number().int(),
    job_name: z.string(),
    client_name: z.string(),
    billable_hours: z.number(),
    non_billable_hours: z.number(),
    total_hours: z.number(),
    revenue: z.number(),
    cost: z.number(),
    profit: z.number(),
    revenue_per_hour: z.number(),
  })
  .passthrough()
const StaffPerformanceStaffData = z
  .object({
    staff_id: z.string(),
    name: z.string(),
    total_hours: z.number(),
    billable_hours: z.number(),
    billable_percentage: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    profit: z.number(),
    revenue_per_hour: z.number(),
    profit_per_hour: z.number(),
    jobs_worked: z.number().int(),
    job_breakdown: z.array(StaffPerformanceJobBreakdown).optional(),
  })
  .passthrough()
const StaffPerformancePeriodSummary = z
  .object({
    start_date: z.string(),
    end_date: z.string(),
    total_staff: z.number().int(),
    period_description: z.string(),
  })
  .passthrough()
const StaffPerformanceResponse = z
  .object({
    team_averages: StaffPerformanceTeamAverages,
    staff: z.array(StaffPerformanceStaffData),
    period_summary: StaffPerformancePeriodSummary,
  })
  .passthrough()
const Staff = z
  .object({
    id: z.string().uuid(),
    password: z.string().max(128).optional(),
    last_login: z.string().datetime({ offset: true }).nullish(),
    is_superuser: z.boolean().optional(),
    icon: z.string().url().nullish(),
    password_needs_reset: z.boolean().optional(),
    email: z.string().max(254).email(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    preferred_name: z.string().max(30).nullish(),
    wage_rate: z.number().gt(-100000000).lt(100000000).optional(),
    ims_payroll_id: z.string().max(100).nullish(),
    raw_ims_data: z.unknown().nullish(),
    xero_user_id: z.string().max(255).nullish(),
    date_left: z.string().nullish(),
    is_staff: z.boolean().optional(),
    date_joined: z.string().datetime({ offset: true }).optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    updated_at: z.string().datetime({ offset: true }),
    hours_mon: z.number().gt(-100).lt(100).optional(),
    hours_tue: z.number().gt(-100).lt(100).optional(),
    hours_wed: z.number().gt(-100).lt(100).optional(),
    hours_thu: z.number().gt(-100).lt(100).optional(),
    hours_fri: z.number().gt(-100).lt(100).optional(),
    hours_sat: z.number().gt(-100).lt(100).optional(),
    hours_sun: z.number().gt(-100).lt(100).optional(),
    groups: z.array(z.number().int()).optional(),
    user_permissions: z.array(z.number().int()).optional(),
  })
  .passthrough()
const PatchedStaff = z
  .object({
    id: z.string().uuid(),
    password: z.string().max(128),
    last_login: z.string().datetime({ offset: true }).nullable(),
    is_superuser: z.boolean(),
    icon: z.string().url().nullable(),
    password_needs_reset: z.boolean(),
    email: z.string().max(254).email(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    preferred_name: z.string().max(30).nullable(),
    wage_rate: z.number().gt(-100000000).lt(100000000),
    ims_payroll_id: z.string().max(100).nullable(),
    raw_ims_data: z.unknown().nullable(),
    xero_user_id: z.string().max(255).nullable(),
    date_left: z.string().nullable(),
    is_staff: z.boolean(),
    date_joined: z.string().datetime({ offset: true }),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    hours_mon: z.number().gt(-100).lt(100),
    hours_tue: z.number().gt(-100).lt(100),
    hours_wed: z.number().gt(-100).lt(100),
    hours_thu: z.number().gt(-100).lt(100),
    hours_fri: z.number().gt(-100).lt(100),
    hours_sat: z.number().gt(-100).lt(100),
    hours_sun: z.number().gt(-100).lt(100),
    groups: z.array(z.number().int()),
    user_permissions: z.array(z.number().int()),
  })
  .partial()
  .passthrough()
const KanbanStaff = z
  .object({
    id: z.string().uuid(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    icon: z.string().nullable(),
    display_name: z.string(),
  })
  .passthrough()
const CustomTokenObtainPair = z.object({ username: z.string(), password: z.string() }).passthrough()
const TokenRefresh = z.object({ access: z.string(), refresh: z.string() }).passthrough()
const TokenVerify = z.object({ token: z.string() }).passthrough()
const UserProfile = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    preferred_name: z.string().nullable(),
    fullName: z.string(),
    is_active: z.boolean(),
    is_staff: z.boolean(),
  })
  .passthrough()
const AWSInstanceStatusResponse = z
  .object({
    success: z.boolean(),
    status: z.string().optional(),
    error: z.string().optional(),
    details: z.string().optional(),
  })
  .passthrough()
const ProviderTypeEnum = z.enum(['Claude', 'Gemini', 'Mistral'])
const AIProvider = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100).optional(),
    default: z.boolean().optional(),
  })
  .passthrough()
const CompanyDefaults = z
  .object({
    company_name: z.string().max(255),
    ai_providers: z.array(AIProvider),
    is_primary: z.boolean().optional(),
    time_markup: z.number().gt(-1000).lt(1000).optional(),
    materials_markup: z.number().gt(-1000).lt(1000).optional(),
    charge_out_rate: z.number().gt(-10000).lt(10000).optional(),
    wage_rate: z.number().gt(-10000).lt(10000).optional(),
    starting_job_number: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    starting_po_number: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    po_prefix: z.string().max(10).optional(),
    master_quote_template_url: z.string().max(200).url().nullish(),
    master_quote_template_id: z.string().max(100).nullish(),
    gdrive_quotes_folder_url: z.string().max(200).url().nullish(),
    gdrive_quotes_folder_id: z.string().max(100).nullish(),
    xero_tenant_id: z.string().max(100).nullish(),
    mon_start: z.string().optional(),
    mon_end: z.string().optional(),
    tue_start: z.string().optional(),
    tue_end: z.string().optional(),
    wed_start: z.string().optional(),
    wed_end: z.string().optional(),
    thu_start: z.string().optional(),
    thu_end: z.string().optional(),
    fri_start: z.string().optional(),
    fri_end: z.string().optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    last_xero_sync: z.string().datetime({ offset: true }).nullish(),
    last_xero_deep_sync: z.string().datetime({ offset: true }).nullish(),
    shop_client_name: z.string().max(255).nullish(),
    billable_threshold_green: z.number().gt(-1000).lt(1000).optional(),
    billable_threshold_amber: z.number().gt(-1000).lt(1000).optional(),
    daily_gp_target: z.number().gt(-100000000).lt(100000000).optional(),
    shop_hours_target_percentage: z.number().gt(-1000).lt(1000).optional(),
  })
  .passthrough()
const PatchedCompanyDefaults = z
  .object({
    company_name: z.string().max(255),
    ai_providers: z.array(AIProvider),
    is_primary: z.boolean(),
    time_markup: z.number().gt(-1000).lt(1000),
    materials_markup: z.number().gt(-1000).lt(1000),
    charge_out_rate: z.number().gt(-10000).lt(10000),
    wage_rate: z.number().gt(-10000).lt(10000),
    starting_job_number: z.number().int().gte(-2147483648).lte(2147483647),
    starting_po_number: z.number().int().gte(-2147483648).lte(2147483647),
    po_prefix: z.string().max(10),
    master_quote_template_url: z.string().max(200).url().nullable(),
    master_quote_template_id: z.string().max(100).nullable(),
    gdrive_quotes_folder_url: z.string().max(200).url().nullable(),
    gdrive_quotes_folder_id: z.string().max(100).nullable(),
    xero_tenant_id: z.string().max(100).nullable(),
    mon_start: z.string(),
    mon_end: z.string(),
    tue_start: z.string(),
    tue_end: z.string(),
    wed_start: z.string(),
    wed_end: z.string(),
    thu_start: z.string(),
    thu_end: z.string(),
    fri_start: z.string(),
    fri_end: z.string(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    last_xero_sync: z.string().datetime({ offset: true }).nullable(),
    last_xero_deep_sync: z.string().datetime({ offset: true }).nullable(),
    shop_client_name: z.string().max(255).nullable(),
    billable_threshold_green: z.number().gt(-1000).lt(1000),
    billable_threshold_amber: z.number().gt(-1000).lt(1000),
    daily_gp_target: z.number().gt(-100000000).lt(100000000),
    shop_hours_target_percentage: z.number().gt(-1000).lt(1000),
  })
  .partial()
  .passthrough()
const AIProviderCreateUpdate = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100).optional(),
    default: z.boolean().optional(),
    api_key: z.string().optional(),
    company: z.string(),
  })
  .passthrough()
const PatchedAIProviderCreateUpdate = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100),
    default: z.boolean(),
    api_key: z.string(),
    company: z.string(),
  })
  .partial()
  .passthrough()
const AppError = z
  .object({
    id: z.string().uuid(),
    timestamp: z.string().datetime({ offset: true }),
    message: z.string(),
    data: z.unknown().nullish(),
    app: z.string().max(50).nullish(),
    file: z.string().max(200).nullish(),
    function: z.string().max(100).nullish(),
    severity: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    job_id: z.string().uuid().nullish(),
    user_id: z.string().uuid().nullish(),
    resolved: z.boolean().optional(),
    resolved_timestamp: z.string().datetime({ offset: true }).nullish(),
    resolved_by: z.string().uuid().nullish(),
  })
  .passthrough()
const PaginatedAppErrorList = z
  .object({
    count: z.number().int(),
    next: z.string().url().nullish(),
    previous: z.string().url().nullish(),
    results: z.array(AppError),
  })
  .passthrough()
const XeroDocumentSuccessResponse = z
  .object({
    success: z.boolean().optional().default(true),
    xero_id: z.string().uuid(),
    online_url: z.string().url().optional(),
    messages: z.array(z.string()).optional(),
    client: z.string().optional(),
    total_excl_tax: z.number().gt(-10000000000).lt(10000000000).optional(),
    total_incl_tax: z.number().gt(-10000000000).lt(10000000000).optional(),
    action: z.string().optional(),
  })
  .passthrough()
const XeroDocumentErrorResponse = z
  .object({
    success: z.boolean().optional().default(false),
    error: z.string(),
    messages: z.array(z.string()).optional(),
    error_type: z.string().optional(),
    redirect_to_auth: z.boolean().optional(),
  })
  .passthrough()
const ClientContactResult = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    position: z.string(),
    is_primary: z.boolean(),
  })
  .passthrough()
const ClientContactResponse = z.object({ results: z.array(ClientContactResult) }).passthrough()
const ClientErrorResponse = z
  .object({
    success: z.boolean().optional().default(false),
    error: z.string(),
    details: z.string().optional(),
  })
  .passthrough()
const ClientNameOnly = z.object({ id: z.string().uuid(), name: z.string() }).passthrough()
const ClientContactCreateRequest = z
  .object({
    client_id: z.string().uuid(),
    name: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    position: z.string().max(255).optional(),
    is_primary: z.boolean().optional().default(false),
    notes: z.string().optional(),
  })
  .passthrough()
const ClientContactCreateResponse = z
  .object({
    success: z.boolean(),
    contact: ClientContactResult,
    message: z.string(),
  })
  .passthrough()
const ClientCreateRequest = z
  .object({
    name: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    is_account_customer: z.boolean().optional().default(true),
  })
  .passthrough()
const ClientSearchResult = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    is_account_customer: z.boolean(),
    xero_contact_id: z.string(),
    last_invoice_date: z.string(),
    total_spend: z.string(),
  })
  .passthrough()
const ClientCreateResponse = z
  .object({
    success: z.boolean(),
    client: ClientSearchResult,
    message: z.string(),
  })
  .passthrough()
const ClientDuplicateErrorResponse = z
  .object({
    success: z.boolean().optional().default(false),
    error: z.string(),
    existing_client: z.object({}).partial().passthrough(),
  })
  .passthrough()
const ClientSearchResponse = z.object({ results: z.array(ClientSearchResult) }).passthrough()
const JobFileStatusEnum = z.enum(['active', 'deleted'])
const JobFile = z
  .object({
    id: z.string().uuid(),
    filename: z.string().max(255),
    size: z.number().int().nullable(),
    mime_type: z.string().max(100).optional(),
    uploaded_at: z.string().datetime({ offset: true }),
    print_on_jobsheet: z.boolean().optional(),
    download_url: z.string(),
    thumbnail_url: z.string().nullable(),
    status: JobFileStatusEnum.optional(),
  })
  .passthrough()
const JobFileErrorResponse = z
  .object({
    status: z.string().optional().default('error'),
    message: z.string(),
  })
  .passthrough()
const UploadedFile = z
  .object({
    id: z.string(),
    filename: z.string(),
    file_path: z.string(),
    print_on_jobsheet: z.boolean(),
  })
  .passthrough()
const JobFileUploadSuccessResponse = z
  .object({
    status: z.string().optional().default('success'),
    uploaded: z.array(UploadedFile),
    message: z.string(),
  })
  .passthrough()
const JobFileUploadPartialResponse = z
  .object({
    status: z.string(),
    uploaded: z.array(UploadedFile),
    errors: z.array(z.string()),
  })
  .passthrough()
const JobFileUpdateSuccessResponse = z
  .object({
    status: z.string().optional().default('success'),
    message: z.string(),
    print_on_jobsheet: z.boolean(),
  })
  .passthrough()
const AssignJobRequest = z.object({ job_id: z.string(), staff_id: z.string() }).passthrough()
const AssignJobResponse = z.object({ success: z.boolean(), message: z.string() }).passthrough()
const CompleteJob = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string(),
    updated_at: z.string().datetime({ offset: true }),
    job_status: z.string(),
  })
  .passthrough()
const PaginatedCompleteJobList = z
  .object({
    count: z.number().int(),
    next: z.string().url().nullish(),
    previous: z.string().url().nullish(),
    results: z.array(CompleteJob),
  })
  .passthrough()
const ArchiveJobsRequest = z.object({ ids: z.array(z.string()) }).passthrough()
const JobQuoteChatHistoryResponse = z
  .object({ success: z.boolean(), data: z.object({}).partial().passthrough() })
  .passthrough()
const RoleEnum = z.enum(['user', 'assistant'])
const JobQuoteChat = z
  .object({
    message_id: z.string().max(100),
    role: RoleEnum,
    content: z.string(),
    metadata: z.unknown().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PatchedJobQuoteChatUpdate = z
  .object({ content: z.string(), metadata: z.unknown() })
  .partial()
  .passthrough()
const JobQuoteChatUpdate = z
  .object({ content: z.string(), metadata: z.unknown() })
  .partial()
  .passthrough()
const JobQuoteChatInteractionRequest = z.object({ message: z.string().max(5000) }).passthrough()
const JobReorderRequest = z
  .object({
    before_id: z.string().uuid().nullable(),
    after_id: z.string().uuid().nullable(),
    status: z.string().nullable(),
  })
  .partial()
  .passthrough()
const KanbanSuccessResponse = z
  .object({
    success: z.boolean().optional().default(true),
    message: z.string(),
  })
  .passthrough()
const KanbanErrorResponse = z
  .object({ success: z.boolean().optional().default(false), error: z.string() })
  .passthrough()
const JobStatusUpdateRequest = z.object({ status: z.string() }).passthrough()
const KanbanJobPerson = z
  .object({
    id: z.string().uuid(),
    display_name: z.string(),
    icon: z.string().url().nullable(),
  })
  .passthrough()
const KanbanJob = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    job_number: z.number().int(),
    client_name: z.string(),
    contact_person: z.string(),
    people: z.array(KanbanJobPerson),
    status: z.string(),
    status_key: z.string(),
    rejected_flag: z.boolean(),
    paid: z.boolean(),
    created_by_id: z.string().uuid().nullable(),
    created_at: z.string().nullable(),
    priority: z.number(),
  })
  .passthrough()
const AdvancedSearchResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanJob),
    total: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchAllJobsResponse = z
  .object({
    success: z.boolean().default(true),
    active_jobs: z.array(KanbanJob),
    archived_jobs: z.array(KanbanJob),
    total_archived: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const KanbanColumnJob = z
  .object({
    id: z.string(),
    job_number: z.number().int(),
    name: z.string(),
    description: z.string().nullable(),
    client_name: z.string(),
    contact_person: z.string(),
    people: z.array(KanbanJobPerson),
    status: z.string(),
    status_key: z.string(),
    paid: z.boolean(),
    created_by_id: z.string().nullable(),
    created_at: z.string().nullable(),
    priority: z.number(),
    badge_label: z.string(),
    badge_color: z.string(),
  })
  .passthrough()
const FetchJobsByColumnResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanColumnJob),
    total: z.number().int(),
    filtered_count: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchJobsResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanJob),
    total: z.number().int(),
    filtered_count: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchStatusValuesResponse = z
  .object({
    success: z.boolean().default(true),
    statuses: z.record(z.string()),
    tooltips: z.record(z.string()),
    error: z.string(),
  })
  .partial()
  .passthrough()
const WorkshopPDFResponse = z
  .object({ status: z.string(), message: z.string() })
  .partial()
  .passthrough()
const Kind332Enum = z.enum(['time', 'material', 'adjust'])
const PatchedCostLineCreateUpdate = z
  .object({
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z.number().gt(-10000000).lt(10000000),
    unit_cost: z.number().gt(-100000000).lt(100000000),
    unit_rev: z.number().gt(-100000000).lt(100000000),
    ext_refs: z.unknown(),
    meta: z.unknown(),
  })
  .partial()
  .passthrough()
const CostLineCreateUpdate = z
  .object({
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z.number().gt(-10000000).lt(10000000).optional(),
    unit_cost: z.number().gt(-100000000).lt(100000000).optional(),
    unit_rev: z.number().gt(-100000000).lt(100000000).optional(),
    ext_refs: z.unknown().optional(),
    meta: z.unknown().optional(),
  })
  .passthrough()
const CostLineErrorResponse = z.object({ error: z.string() }).passthrough()
const JobCreateRequest = z
  .object({
    name: z.string().max(255),
    client_id: z.string().uuid(),
    description: z.string().optional(),
    order_number: z.string().optional(),
    notes: z.string().optional(),
    contact_id: z.string().uuid().nullish(),
  })
  .passthrough()
const JobCreateResponse = z
  .object({
    success: z.boolean().optional().default(true),
    job_id: z.string(),
    job_number: z.number().int(),
    message: z.string(),
  })
  .passthrough()
const JobRestErrorResponse = z.object({ error: z.string() }).passthrough()
const CostSetKindEnum = z.enum(['estimate', 'quote', 'actual'])
const CostSetSummary = z
  .object({
    cost: z.number(),
    rev: z.number(),
    hours: z.number(),
    profitMargin: z.number(),
  })
  .passthrough()
const CostLine = z
  .object({
    id: z.string().uuid(),
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z.number().gt(-10000000).lt(10000000).optional(),
    unit_cost: z.number().gt(-100000000).lt(100000000).optional(),
    unit_rev: z.number().gt(-100000000).lt(100000000).optional(),
    total_cost: z.number(),
    total_rev: z.number(),
    ext_refs: z.unknown().optional(),
    meta: z.unknown().optional(),
  })
  .passthrough()
const CostSet = z
  .object({
    id: z.string(),
    kind: CostSetKindEnum,
    rev: z.number().int(),
    summary: CostSetSummary,
    created: z.string().datetime({ offset: true }),
    cost_lines: z.array(CostLine),
  })
  .passthrough()
const PricingMethodologyEnum = z.enum(['time_materials', 'fixed_price'])
const QuoteSpreadsheet = z
  .object({
    id: z.string().uuid(),
    sheet_id: z.string().max(100),
    sheet_url: z.string().max(500).url().nullish(),
    tab: z.string().max(100).nullish(),
    job_id: z.string(),
    job_number: z.number().int(),
    job_name: z.string(),
  })
  .passthrough()
const Status7aeEnum = z.enum(['DRAFT', 'SENT', 'DECLINED', 'ACCEPTED', 'INVOICED', 'DELETED'])
const Quote = z
  .object({
    id: z.string().uuid(),
    xero_id: z.string().uuid(),
    status: Status7aeEnum.optional(),
    date: z.string(),
    total_excl_tax: z.number(),
    total_incl_tax: z.number(),
    online_url: z.string().max(200).url().nullish(),
  })
  .passthrough()
const Status1beEnum = z.enum(['DRAFT', 'SUBMITTED', 'AUTHORISED', 'DELETED', 'VOIDED', 'PAID'])
const Invoice = z
  .object({
    id: z.string().uuid(),
    xero_id: z.string().uuid(),
    number: z.string().max(255),
    status: Status1beEnum.optional(),
    date: z.string(),
    due_date: z.string().nullish(),
    total_excl_tax: z.number(),
    total_incl_tax: z.number(),
    amount_due: z.number(),
    tax: z.number().optional(),
    online_url: z.string().max(200).url().nullish(),
  })
  .passthrough()
const XeroQuote = z
  .object({
    status: Status7aeEnum,
    online_url: z.string().max(200).url().nullable(),
  })
  .partial()
  .passthrough()
const XeroInvoice = z
  .object({
    number: z.string().max(255),
    status: Status1beEnum.optional(),
    online_url: z.string().max(200).url().nullish(),
  })
  .passthrough()
const Job = z
  .object({
    id: z.string().uuid(),
    name: z.string().max(100),
    client_id: z.string().uuid().nullish(),
    client_name: z.string().nullable(),
    contact_id: z.string().uuid().nullish(),
    contact_name: z.string().nullable(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    notes: z.string().nullish(),
    order_number: z.string().max(100).nullish(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    description: z.string().nullish(),
    latest_estimate: CostSet,
    latest_quote: CostSet,
    latest_actual: CostSet,
    job_status: z.string(),
    delivery_date: z.string().nullish(),
    paid: z.boolean().optional(),
    quote_acceptance_date: z.string().datetime({ offset: true }).nullish(),
    job_is_valid: z.boolean().optional(),
    job_files: z.array(JobFile).optional(),
    charge_out_rate: z.number().gt(-100000000).lt(100000000),
    pricing_methodology: PricingMethodologyEnum.optional(),
    quote_sheet: QuoteSpreadsheet.nullable(),
    quoted: z.boolean(),
    fully_invoiced: z.boolean(),
    quote: Quote.nullable(),
    invoices: z.array(Invoice),
    xero_quote: XeroQuote.nullable(),
    xero_invoices: z.array(XeroInvoice),
    shop_job: z.boolean(),
  })
  .passthrough()
const JobEvent = z
  .object({
    id: z.string().uuid(),
    description: z.string(),
    timestamp: z.string().datetime({ offset: true }),
    staff: z.string().nullable(),
    event_type: z.string(),
  })
  .passthrough()
const CompanyDefaultsJobDetail = z
  .object({
    materials_markup: z.number(),
    time_markup: z.number(),
    charge_out_rate: z.number(),
    wage_rate: z.number(),
  })
  .passthrough()
const JobData = z
  .object({
    job: Job,
    events: z.array(JobEvent),
    company_defaults: CompanyDefaultsJobDetail,
  })
  .passthrough()
const JobDetailResponse = z
  .object({ success: z.boolean().optional().default(true), data: JobData })
  .passthrough()
const JobDeleteResponse = z
  .object({
    success: z.boolean().optional().default(true),
    message: z.string(),
  })
  .passthrough()
const QuoteRevisionsList = z
  .object({
    job_id: z.string(),
    job_number: z.number().int(),
    current_cost_set_rev: z.number().int(),
    total_revisions: z.number().int(),
    revisions: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough()
const QuoteRevisionRequest = z
  .object({ reason: z.string().max(500) })
  .partial()
  .passthrough()
const QuoteRevisionResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    quote_revision: z.number().int(),
    archived_cost_lines_count: z.number().int(),
    job_id: z.string(),
    error: z.string().optional(),
  })
  .passthrough()
const JobEventCreateRequest = z.object({ description: z.string().max(500) }).passthrough()
const JobEventCreateResponse = z.object({ success: z.boolean(), event: JobEvent }).passthrough()
const JobQuoteAcceptance = z
  .object({
    success: z.boolean(),
    job_id: z.string().uuid(),
    quote_acceptance_date: z.string(),
    message: z.string(),
  })
  .passthrough()
const QuoteImportStatusResponse = z
  .object({
    job_id: z.string(),
    job_name: z.string(),
    has_quote: z.boolean(),
    quote: CostSet.optional(),
    revision: z.number().int().optional(),
    created: z.string().datetime({ offset: true }).optional(),
    summary: z.unknown().optional(),
  })
  .passthrough()
const DraftLine = z
  .object({
    kind: z.string(),
    desc: z.string(),
    quantity: z.number().gt(-100000000).lt(100000000),
    unit_cost: z.number().gt(-100000000).lt(100000000),
    unit_rev: z.number().gt(-100000000).lt(100000000),
    total_cost: z.number().gt(-100000000).lt(100000000),
    total_rev: z.number().gt(-100000000).lt(100000000),
  })
  .passthrough()
const QuoteChanges = z
  .object({
    additions: z.array(DraftLine),
    updates: z.array(DraftLine),
    deletions: z.array(DraftLine),
  })
  .passthrough()
const ApplyQuoteResponse = z
  .object({
    success: z.boolean(),
    cost_set: CostSet.nullish(),
    draft_lines: z.array(DraftLine).optional(),
    changes: QuoteChanges.optional(),
    error: z.string().optional(),
  })
  .passthrough()
const LinkQuoteSheetRequest = z.object({ template_url: z.string().url() }).partial().passthrough()
const ValidationReport = z
  .object({ warnings: z.array(z.string()), errors: z.array(z.string()) })
  .partial()
  .passthrough()
const DiffPreview = z
  .object({
    additions_count: z.number().int(),
    updates_count: z.number().int(),
    deletions_count: z.number().int(),
    total_changes: z.number().int(),
    next_revision: z.number().int().optional(),
    current_revision: z.number().int().nullish(),
  })
  .passthrough()
const PreviewQuoteResponse = z
  .object({
    success: z.boolean(),
    draft_lines: z.array(DraftLine),
    changes: QuoteChanges,
    message: z.string(),
    can_proceed: z.boolean().default(false),
    validation_report: ValidationReport.nullable(),
    diff_preview: DiffPreview.nullable(),
  })
  .partial()
  .passthrough()
const JobFileThumbnailErrorResponse = z
  .object({
    status: z.string().optional().default('error'),
    message: z.string(),
  })
  .passthrough()
const JobFileUploadViewResponse = z
  .object({
    status: z.string().optional().default('success'),
    uploaded: z.array(JobFile),
    message: z.string(),
  })
  .passthrough()
const WeeklyMetrics = z
  .object({
    job_id: z.string().uuid(),
    job_number: z.number().int(),
    name: z.string(),
    client: z.string().nullish(),
    description: z.string().nullish(),
    status: z.string(),
    people: z.array(z.object({}).partial().passthrough()),
    estimated_hours: z.number(),
    actual_hours: z.number(),
    profit: z.number(),
  })
  .passthrough()
const MonthEndJobHistory = z
  .object({
    date: z.string(),
    total_hours: z.number(),
    total_dollars: z.number(),
  })
  .passthrough()
const MonthEndJob = z
  .object({
    job_id: z.string().uuid(),
    job_number: z.number().int(),
    job_name: z.string(),
    client_name: z.string(),
    history: z.array(MonthEndJobHistory),
    total_hours: z.number(),
    total_dollars: z.number(),
  })
  .passthrough()
const MonthEndStockHistory = z
  .object({
    date: z.string(),
    material_line_count: z.number().int(),
    material_cost: z.number(),
  })
  .passthrough()
const MonthEndStockJob = z
  .object({
    job_id: z.string().uuid(),
    job_number: z.number().int(),
    job_name: z.string(),
    history: z.array(MonthEndStockHistory),
  })
  .passthrough()
const MonthEndGetResponse = z
  .object({ jobs: z.array(MonthEndJob), stock_job: MonthEndStockJob })
  .passthrough()
const MonthEndPostResponse = z
  .object({
    processed: z.array(z.string().uuid()),
    errors: z.array(z.string()),
  })
  .passthrough()
const TimesheetCostLine = z
  .object({
    id: z.string().uuid(),
    kind: Kind332Enum,
    desc: z.string(),
    quantity: z.number().gt(-10000000).lt(10000000),
    unit_cost: z.number().gt(-100000000).lt(100000000),
    unit_rev: z.number().gt(-100000000).lt(100000000),
    total_cost: z.number(),
    total_rev: z.number(),
    ext_refs: z.unknown(),
    meta: z.unknown(),
    job_id: z.string(),
    job_number: z.number().int(),
    job_name: z.string(),
    client_name: z.string(),
    charge_out_rate: z.number().gt(-100000000).lt(100000000),
    wage_rate: z.number(),
  })
  .passthrough()
const ModernTimesheetStaff = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .passthrough()
const ModernTimesheetSummary = z
  .object({
    total_hours: z.number(),
    billable_hours: z.number(),
    non_billable_hours: z.number(),
    total_cost: z.number(),
    total_revenue: z.number(),
    entry_count: z.number().int(),
  })
  .passthrough()
const ModernTimesheetEntryGetResponse = z
  .object({
    cost_lines: z.array(TimesheetCostLine),
    staff: ModernTimesheetStaff,
    date: z.string(),
    summary: ModernTimesheetSummary,
  })
  .passthrough()
const ModernTimesheetErrorResponse = z.object({ error: z.string() }).passthrough()
const ModernTimesheetEntryPostRequest = z
  .object({
    job_id: z.string().uuid(),
    staff_id: z.string().uuid(),
    date: z.string(),
    hours: z.number().gte(0),
    description: z.string().max(500),
    is_billable: z.boolean().optional().default(true),
    hourly_rate: z.number().gte(0).optional(),
  })
  .passthrough()
const ModernTimesheetEntryPostResponse = z
  .object({
    success: z.boolean(),
    cost_line_id: z.string().uuid().optional(),
    message: z.string().optional(),
  })
  .passthrough()
const ModernTimesheetJobGetResponse = z
  .object({ jobs: z.array(Job), total_count: z.number().int() })
  .passthrough()
const ModernTimesheetDayGetResponse = z
  .object({
    entries: z.array(TimesheetCostLine),
    summary: ModernTimesheetSummary,
    date: z.string(),
  })
  .passthrough()
const DeliveryReceiptAllocation = z
  .object({
    job_id: z.string().uuid(),
    quantity: z.number().gt(-100000000).lt(100000000),
    retail_rate: z.number().gt(-1000).lt(1000).optional(),
    metadata: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const DeliveryReceiptLine = z
  .object({
    total_received: z.number().gt(-100000000).lt(100000000),
    allocations: z.array(DeliveryReceiptAllocation),
  })
  .passthrough()
const DeliveryReceiptRequest = z
  .object({
    purchase_order_id: z.string().uuid(),
    allocations: z.record(DeliveryReceiptLine),
  })
  .passthrough()
const DeliveryReceiptResponse = z
  .object({ success: z.boolean(), error: z.string().optional() })
  .passthrough()
const PurchaseOrderEmailRequest = z
  .object({
    recipient_email: z.string().email(),
    message: z.string().max(1000),
  })
  .partial()
  .passthrough()
const PurchaseOrderPDFResponse = z
  .object({ success: z.boolean(), message: z.string() })
  .partial()
  .passthrough()
const Status7b9Enum = z.enum([
  'draft',
  'awaiting_approval',
  'approved',
  'in_progress',
  'unusual',
  'recently_completed',
  'special',
  'archived',
])
const JobForPurchasing = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string(),
    status: Status7b9Enum.optional(),
    is_stock_holding: z.boolean(),
    job_display_name: z.string(),
  })
  .passthrough()
const AllJobsResponse = z
  .object({
    success: z.boolean(),
    jobs: z.array(JobForPurchasing),
    stock_holding_job_id: z.string(),
  })
  .passthrough()
const PurchasingJobsResponse = z
  .object({ jobs: z.array(JobForPurchasing), total_count: z.number().int() })
  .passthrough()
const PurchaseOrderList = z
  .object({
    id: z.string().uuid(),
    po_number: z.string(),
    status: z.string(),
    order_date: z.string(),
    supplier: z.string(),
    supplier_id: z.string().uuid().nullable(),
  })
  .passthrough()
const PurchaseOrderLineCreate = z
  .object({
    job_id: z.string().uuid().nullable(),
    description: z.string().max(255),
    quantity: z.number().gt(-100000000).lt(100000000).default(0),
    unit_cost: z.number().gt(-100000000).lt(100000000).nullable(),
    price_tbc: z.boolean().default(false),
    item_code: z.string().max(100),
    metal_type: z.string().max(100),
    alloy: z.string().max(100),
    specifics: z.string().max(255),
    location: z.string().max(255),
    dimensions: z.string().max(255),
  })
  .partial()
  .passthrough()
const PurchaseOrderCreate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    order_date: z.string().nullable(),
    expected_delivery: z.string().nullable(),
    lines: z.array(PurchaseOrderLineCreate),
  })
  .partial()
  .passthrough()
const PurchaseOrderDetailStatusEnum = z.enum([
  'draft',
  'submitted',
  'partially_received',
  'fully_received',
  'deleted',
])
const MetalTypeEnum = z.enum([
  'stainless_steel',
  'mild_steel',
  'aluminum',
  'brass',
  'copper',
  'titanium',
  'zinc',
  'galvanized',
  'unspecified',
  'other',
])
const BlankEnum = z.unknown()
const NullEnum = z.unknown()
const PurchaseOrderLine = z
  .object({
    id: z.string().uuid(),
    item_code: z.string().max(50).nullish(),
    description: z.string().max(200),
    quantity: z.number().gt(-100000000).lt(100000000),
    received_quantity: z.number().gt(-100000000).lt(100000000).optional(),
    unit_cost: z.number().gt(-100000000).lt(100000000).nullish(),
    price_tbc: z.boolean().optional(),
    metal_type: z.union([MetalTypeEnum, BlankEnum, NullEnum]).nullish(),
    alloy: z.string().max(50).nullish(),
    specifics: z.string().max(255).nullish(),
    location: z.string().max(255).nullish(),
    dimensions: z.string().max(255).nullish(),
    job_id: z.string().uuid().nullish(),
  })
  .passthrough()
const PurchaseOrderDetail = z
  .object({
    id: z.string().uuid(),
    po_number: z.string().max(50),
    reference: z.string().max(100).nullish(),
    supplier: z.string(),
    supplier_id: z.string().nullable(),
    supplier_has_xero_id: z.boolean(),
    status: PurchaseOrderDetailStatusEnum.optional(),
    order_date: z.string().optional(),
    expected_delivery: z.string().nullish(),
    lines: z.array(PurchaseOrderLine),
    online_url: z.string().max(500).url().nullish(),
    xero_id: z.string().uuid().nullish(),
  })
  .passthrough()
const PurchaseOrderLineUpdate = z
  .object({
    id: z.string().uuid().nullable(),
    job_id: z.string().uuid().nullable(),
    description: z.string().max(255),
    quantity: z.number().gt(-100000000).lt(100000000).default(0),
    unit_cost: z.number().gt(-100000000).lt(100000000).nullable(),
    price_tbc: z.boolean().default(false),
    item_code: z.string().max(100),
    metal_type: z.string().max(100),
    alloy: z.string().max(100),
    specifics: z.string().max(255),
    location: z.string().max(255),
    dimensions: z.string().max(255),
  })
  .partial()
  .passthrough()
const PatchedPurchaseOrderUpdate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    expected_delivery: z.string().nullable(),
    status: z.string().max(50),
    lines_to_delete: z.array(z.string().uuid()),
    lines: z.array(PurchaseOrderLineUpdate),
  })
  .partial()
  .passthrough()
const PurchaseOrderUpdate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    expected_delivery: z.string().nullable(),
    status: z.string().max(50),
    lines_to_delete: z.array(z.string().uuid()),
    lines: z.array(PurchaseOrderLineUpdate),
  })
  .partial()
  .passthrough()
const AllocationItemTypeEnum = z.enum(['job', 'stock'])
const AllocationItem = z
  .object({
    type: AllocationItemTypeEnum,
    job_id: z.string().uuid(),
    job_name: z.string(),
    quantity: z.number(),
    retail_rate: z.number().optional().default(0),
    allocation_date: z.string().datetime({ offset: true }).nullable(),
    description: z.string(),
    stock_location: z.string().nullish(),
    metal_type: z.string().nullish(),
    alloy: z.string().nullish(),
    specifics: z.string().nullish(),
    allocation_id: z.string().uuid().nullish(),
  })
  .passthrough()
const PurchaseOrderAllocationsResponse = z
  .object({
    po_id: z.string().uuid(),
    allocations: z.record(z.array(AllocationItem)),
  })
  .passthrough()
const TypeC98Enum = z.enum(['stock', 'job'])
const AllocationDetailsResponse = z
  .object({
    type: TypeC98Enum,
    id: z.string().uuid(),
    description: z.string(),
    quantity: z.number(),
    job_name: z.string(),
    can_delete: z.boolean(),
    consumed_by_jobs: z.number().int().optional(),
    location: z.string().optional(),
    unit_cost: z.number().optional(),
    unit_revenue: z.number().optional(),
  })
  .passthrough()
const AllocationTypeEnum = z.enum(['stock', 'job'])
const AllocationDeleteRequest = z
  .object({
    allocation_type: AllocationTypeEnum,
    allocation_id: z.string().uuid(),
  })
  .passthrough()
const AllocationDeleteResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    deleted_quantity: z.number().optional(),
    description: z.string().optional(),
    job_name: z.string().optional(),
    updated_received_quantity: z.number().optional(),
  })
  .passthrough()
const StockItem = z
  .object({
    id: z.string().uuid().nullable(),
    description: z.string().nullable(),
    quantity: z.number().nullable(),
    unit_cost: z.number().nullable(),
    metal_type: z.string().nullable(),
    alloy: z.string().nullable(),
    specifics: z.string().nullable(),
    location: z.string().nullable(),
    source: z.string().nullable(),
    date: z.string().datetime({ offset: true }).nullable(),
    job_id: z.string().uuid().nullable(),
    notes: z.string().nullable(),
    item_code: z.string().nullable(),
  })
  .partial()
  .passthrough()
const StockList = z
  .object({ items: z.array(StockItem), total_count: z.number().int() })
  .passthrough()
const StockCreate = z
  .object({
    description: z.string().max(255),
    quantity: z.number().gt(-100000000).lt(100000000),
    unit_cost: z.number().gt(-100000000).lt(100000000),
    source: z.string().max(100),
    notes: z.string().max(500).optional(),
    metal_type: z.string().max(100).optional(),
    alloy: z.string().max(100).optional(),
    specifics: z.string().max(255).optional(),
    location: z.string().max(255).optional(),
    dimensions: z.string().max(255).optional(),
  })
  .passthrough()
const StockConsumeRequest = z
  .object({
    job_id: z.string().uuid(),
    quantity: z.number().gte(0).lt(100000000),
    unit_cost: z.number().gt(-100000000).lt(100000000).nullish(),
    unit_rev: z.number().gt(-100000000).lt(100000000).nullish(),
  })
  .passthrough()
const StockConsumeResponse = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    remaining_quantity: z.number().gt(-100000000).lt(100000000).optional(),
  })
  .passthrough()
const XeroItem = z
  .object({
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sales_details: z.object({}).partial().passthrough().optional(),
    purchase_details: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const XeroItemListResponse = z
  .object({
    items: z.array(XeroItem),
    total_count: z.number().int().optional(),
  })
  .passthrough()
const DjangoJobExecutionStatusEnum = z.enum(['Started execution', 'Error!', 'Executed'])
const DjangoJobExecution = z
  .object({
    id: z.number().int(),
    job_id: z.string(),
    status: DjangoJobExecutionStatusEnum,
    run_time: z.string().datetime({ offset: true }),
    duration: z.number().gt(-10000000000000).lt(10000000000000).nullish(),
    exception: z.string().max(1000).nullish(),
    traceback: z.string().nullish(),
  })
  .passthrough()
const DjangoJob = z
  .object({
    id: z.string().max(255),
    next_run_time: z.string().datetime({ offset: true }).nullish(),
    job_state: z.string(),
  })
  .passthrough()
const PatchedDjangoJob = z
  .object({
    id: z.string().max(255),
    next_run_time: z.string().datetime({ offset: true }).nullable(),
    job_state: z.string(),
  })
  .partial()
  .passthrough()
const JobBreakdown = z
  .object({
    job_id: z.string(),
    job_number: z.number().int(),
    job_name: z.string(),
    client: z.string(),
    hours: z.number(),
    revenue: z.number(),
    cost: z.number(),
    is_billable: z.boolean(),
  })
  .passthrough()
const StaffDailyData = z
  .object({
    staff_id: z.string(),
    staff_name: z.string(),
    staff_initials: z.string(),
    avatar_url: z.string().nullable(),
    scheduled_hours: z.number(),
    actual_hours: z.number(),
    billable_hours: z.number(),
    non_billable_hours: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    status: z.string(),
    status_class: z.string(),
    billable_percentage: z.number(),
    completion_percentage: z.number(),
    job_breakdown: z.array(JobBreakdown),
    entry_count: z.number().int(),
    alerts: z.array(z.string()),
  })
  .passthrough()
const DailyTotals = z
  .object({
    total_scheduled_hours: z.number(),
    total_actual_hours: z.number(),
    total_billable_hours: z.number(),
    total_non_billable_hours: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    total_entries: z.number().int(),
    completion_percentage: z.number(),
    billable_percentage: z.number(),
    missing_hours: z.number(),
  })
  .passthrough()
const SummaryStats = z
  .object({
    total_staff: z.number().int(),
    complete_staff: z.number().int(),
    partial_staff: z.number().int(),
    missing_staff: z.number().int(),
    completion_rate: z.number(),
  })
  .passthrough()
const DailyTimesheetSummary = z
  .object({
    date: z.string(),
    staff_data: z.array(StaffDailyData),
    daily_totals: DailyTotals,
    summary_stats: SummaryStats,
  })
  .passthrough()
const ModernTimesheetJob = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string().nullable(),
    status: Status7b9Enum.optional(),
    charge_out_rate: z.number().gt(-100000000).lt(100000000),
    has_actual_costset: z.boolean(),
  })
  .passthrough()
const JobsListResponse = z
  .object({ jobs: z.array(ModernTimesheetJob), total_count: z.number().int() })
  .passthrough()
const ModernStaff = z
  .object({
    id: z.string(),
    name: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    wageRate: z.number().gt(-100000000).lt(100000000),
  })
  .passthrough()
const StaffListResponse = z
  .object({ staff: z.array(ModernStaff), total_count: z.number().int() })
  .passthrough()
const WeeklyStaffDataWeeklyHours = z
  .object({
    day: z.string(),
    hours: z.number().gt(-1000).lt(1000),
    billable_hours: z.number().gt(-1000).lt(1000),
    scheduled_hours: z.number().gt(-1000).lt(1000),
    status: z.string(),
    leave_type: z.string().nullish(),
    has_leave: z.boolean(),
  })
  .passthrough()
const WeeklyStaffData = z
  .object({
    staff_id: z.string().uuid(),
    name: z.string(),
    weekly_hours: z.array(WeeklyStaffDataWeeklyHours),
    total_hours: z.number().gt(-100000000).lt(100000000),
    total_billable_hours: z.number().gt(-100000000).lt(100000000),
    billable_percentage: z.number().gt(-1000).lt(1000),
    status: z.string(),
  })
  .passthrough()
const WeeklySummary = z
  .object({
    total_hours: z.number().gt(-100000000).lt(100000000),
    staff_count: z.number().int(),
    billable_percentage: z.number().gt(-1000).lt(1000).nullish(),
  })
  .passthrough()
const JobMetrics = z
  .object({
    total_estimated_profit: z.number().gt(-100000000).lt(100000000),
    total_actual_profit: z.number().gt(-100000000).lt(100000000),
    total_profit: z.number().gt(-100000000).lt(100000000),
  })
  .passthrough()
const WeeklyTimesheetData = z
  .object({
    start_date: z.string(),
    end_date: z.string(),
    week_days: z.array(z.string()),
    staff_data: z.array(WeeklyStaffData),
    weekly_summary: WeeklySummary,
    job_metrics: JobMetrics,
    summary_stats: z.object({}).partial().passthrough(),
    export_mode: z.string(),
    is_current_week: z.boolean(),
    navigation: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const IMSWeeklyStaffDataWeeklyHours = z
  .object({
    day: z.string(),
    hours: z.number().gt(-1000).lt(1000),
    billable_hours: z.number().gt(-1000).lt(1000),
    scheduled_hours: z.number().gt(-1000).lt(1000),
    status: z.string(),
    leave_type: z.string().nullish(),
    has_leave: z.boolean().optional().default(false),
    standard_hours: z.number().gt(-100000000).lt(100000000),
    time_and_half_hours: z.number().gt(-100000000).lt(100000000),
    double_time_hours: z.number().gt(-100000000).lt(100000000),
    unpaid_hours: z.number().gt(-100000000).lt(100000000),
    overtime: z.number().gt(-100000000).lt(100000000),
    leave_hours: z.number().gt(-100000000).lt(100000000),
  })
  .passthrough()
const IMSWeeklyStaffData = z
  .object({
    staff_id: z.string().uuid(),
    name: z.string(),
    weekly_hours: z.array(IMSWeeklyStaffDataWeeklyHours),
    total_hours: z.number().gt(-100000000).lt(100000000),
    total_billable_hours: z.number().gt(-100000000).lt(100000000),
    billable_percentage: z.number().gt(-1000).lt(1000),
    status: z.string(),
    total_standard_hours: z.number().gt(-100000000).lt(100000000),
    total_time_and_half_hours: z.number().gt(-100000000).lt(100000000),
    total_double_time_hours: z.number().gt(-100000000).lt(100000000),
    total_overtime: z.number().gt(-100000000).lt(100000000),
  })
  .passthrough()
const IMSWeeklyTimesheetData = z
  .object({
    start_date: z.string(),
    end_date: z.string(),
    week_days: z.array(z.string()),
    staff_data: z.array(IMSWeeklyStaffData),
    weekly_summary: WeeklySummary,
    job_metrics: JobMetrics,
    summary_stats: z.object({}).partial().passthrough(),
    export_mode: z.string(),
    is_current_week: z.boolean(),
    navigation: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const XeroError = z
  .object({
    id: z.string().uuid(),
    timestamp: z.string().datetime({ offset: true }),
    message: z.string(),
    data: z.unknown().nullish(),
    app: z.string().max(50).nullish(),
    file: z.string().max(200).nullish(),
    function: z.string().max(100).nullish(),
    severity: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    job_id: z.string().uuid().nullish(),
    user_id: z.string().uuid().nullish(),
    resolved: z.boolean().optional(),
    resolved_timestamp: z.string().datetime({ offset: true }).nullish(),
    entity: z.string().max(100),
    reference_id: z.string().max(255),
    kind: z.string().max(50),
    resolved_by: z.string().uuid().nullish(),
  })
  .passthrough()
const PaginatedXeroErrorList = z
  .object({
    count: z.number().int(),
    next: z.string().url().nullish(),
    previous: z.string().url().nullish(),
    results: z.array(XeroError),
  })
  .passthrough()

export const schemas = {
  KPIProfitBreakdown,
  KPIJobBreakdown,
  KPIDetails,
  KPIDayData,
  KPIMonthlyTotals,
  KPIThresholds,
  KPICalendarData,
  StandardError,
  JobAgingFinancialData,
  JobAgingTimingData,
  JobAgingJobData,
  JobAgingResponse,
  StaffPerformanceTeamAverages,
  StaffPerformanceJobBreakdown,
  StaffPerformanceStaffData,
  StaffPerformancePeriodSummary,
  StaffPerformanceResponse,
  Staff,
  PatchedStaff,
  KanbanStaff,
  CustomTokenObtainPair,
  TokenRefresh,
  TokenVerify,
  UserProfile,
  AWSInstanceStatusResponse,
  ProviderTypeEnum,
  AIProvider,
  CompanyDefaults,
  PatchedCompanyDefaults,
  AIProviderCreateUpdate,
  PatchedAIProviderCreateUpdate,
  AppError,
  PaginatedAppErrorList,
  XeroDocumentSuccessResponse,
  XeroDocumentErrorResponse,
  ClientContactResult,
  ClientContactResponse,
  ClientErrorResponse,
  ClientNameOnly,
  ClientContactCreateRequest,
  ClientContactCreateResponse,
  ClientCreateRequest,
  ClientSearchResult,
  ClientCreateResponse,
  ClientDuplicateErrorResponse,
  ClientSearchResponse,
  JobFileStatusEnum,
  JobFile,
  JobFileErrorResponse,
  UploadedFile,
  JobFileUploadSuccessResponse,
  JobFileUploadPartialResponse,
  JobFileUpdateSuccessResponse,
  AssignJobRequest,
  AssignJobResponse,
  CompleteJob,
  PaginatedCompleteJobList,
  ArchiveJobsRequest,
  JobQuoteChatHistoryResponse,
  RoleEnum,
  JobQuoteChat,
  PatchedJobQuoteChatUpdate,
  JobQuoteChatUpdate,
  JobQuoteChatInteractionRequest,
  JobReorderRequest,
  KanbanSuccessResponse,
  KanbanErrorResponse,
  JobStatusUpdateRequest,
  KanbanJobPerson,
  KanbanJob,
  AdvancedSearchResponse,
  FetchAllJobsResponse,
  KanbanColumnJob,
  FetchJobsByColumnResponse,
  FetchJobsResponse,
  FetchStatusValuesResponse,
  WorkshopPDFResponse,
  Kind332Enum,
  PatchedCostLineCreateUpdate,
  CostLineCreateUpdate,
  CostLineErrorResponse,
  JobCreateRequest,
  JobCreateResponse,
  JobRestErrorResponse,
  CostSetKindEnum,
  CostSetSummary,
  CostLine,
  CostSet,
  PricingMethodologyEnum,
  QuoteSpreadsheet,
  Status7aeEnum,
  Quote,
  Status1beEnum,
  Invoice,
  XeroQuote,
  XeroInvoice,
  Job,
  JobEvent,
  CompanyDefaultsJobDetail,
  JobData,
  JobDetailResponse,
  JobDeleteResponse,
  QuoteRevisionsList,
  QuoteRevisionRequest,
  QuoteRevisionResponse,
  JobEventCreateRequest,
  JobEventCreateResponse,
  JobQuoteAcceptance,
  QuoteImportStatusResponse,
  DraftLine,
  QuoteChanges,
  ApplyQuoteResponse,
  LinkQuoteSheetRequest,
  ValidationReport,
  DiffPreview,
  PreviewQuoteResponse,
  JobFileThumbnailErrorResponse,
  JobFileUploadViewResponse,
  WeeklyMetrics,
  MonthEndJobHistory,
  MonthEndJob,
  MonthEndStockHistory,
  MonthEndStockJob,
  MonthEndGetResponse,
  MonthEndPostResponse,
  TimesheetCostLine,
  ModernTimesheetStaff,
  ModernTimesheetSummary,
  ModernTimesheetEntryGetResponse,
  ModernTimesheetErrorResponse,
  ModernTimesheetEntryPostRequest,
  ModernTimesheetEntryPostResponse,
  ModernTimesheetJobGetResponse,
  ModernTimesheetDayGetResponse,
  DeliveryReceiptAllocation,
  DeliveryReceiptLine,
  DeliveryReceiptRequest,
  DeliveryReceiptResponse,
  PurchaseOrderEmailRequest,
  PurchaseOrderPDFResponse,
  Status7b9Enum,
  JobForPurchasing,
  AllJobsResponse,
  PurchasingJobsResponse,
  PurchaseOrderList,
  PurchaseOrderLineCreate,
  PurchaseOrderCreate,
  PurchaseOrderDetailStatusEnum,
  MetalTypeEnum,
  BlankEnum,
  NullEnum,
  PurchaseOrderLine,
  PurchaseOrderDetail,
  PurchaseOrderLineUpdate,
  PatchedPurchaseOrderUpdate,
  PurchaseOrderUpdate,
  AllocationItemTypeEnum,
  AllocationItem,
  PurchaseOrderAllocationsResponse,
  TypeC98Enum,
  AllocationDetailsResponse,
  AllocationTypeEnum,
  AllocationDeleteRequest,
  AllocationDeleteResponse,
  StockItem,
  StockList,
  StockCreate,
  StockConsumeRequest,
  StockConsumeResponse,
  XeroItem,
  XeroItemListResponse,
  DjangoJobExecutionStatusEnum,
  DjangoJobExecution,
  DjangoJob,
  PatchedDjangoJob,
  JobBreakdown,
  StaffDailyData,
  DailyTotals,
  SummaryStats,
  DailyTimesheetSummary,
  ModernTimesheetJob,
  JobsListResponse,
  ModernStaff,
  StaffListResponse,
  WeeklyStaffDataWeeklyHours,
  WeeklyStaffData,
  WeeklySummary,
  JobMetrics,
  WeeklyTimesheetData,
  IMSWeeklyStaffDataWeeklyHours,
  IMSWeeklyStaffData,
  IMSWeeklyTimesheetData,
  XeroError,
  PaginatedXeroErrorList,
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/accounting/api/reports/calendar/',
    alias: 'accounting_api_reports_calendar_retrieve',
    description: `Returns aggregated KPIs for display in calendar`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'month',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'year',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: KPICalendarData,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string(), details: z.unknown().optional() }).passthrough(),
      },
      {
        status: 500,
        schema: z.object({ error: z.string(), details: z.unknown().optional() }).passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/accounting/api/reports/job-aging/',
    alias: 'accounting_api_reports_job_aging_retrieve',
    description: `Get job aging data.

Query Parameters:
    include_archived (bool): Whether to include archived jobs.
        Defaults to False.

Returns:
    JSON response with job aging data structure`,
    requestFormat: 'json',
    response: JobAgingResponse,
  },
  {
    method: 'get',
    path: '/accounting/api/reports/staff-performance-summary/',
    alias: 'accounting_api_reports_staff_performance_summary_retrieve',
    description: `API endpoint for staff performance summary (all staff)`,
    requestFormat: 'json',
    response: StaffPerformanceResponse,
  },
  {
    method: 'get',
    path: '/accounting/api/reports/staff-performance/:staff_id/',
    alias: 'accounting_api_reports_staff_performance_retrieve',
    description: `API endpoint for individual staff performance detail`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: StaffPerformanceResponse,
  },
  {
    method: 'get',
    path: '/accounts/api/staff/',
    alias: 'accounts_api_staff_list',
    description: `API endpoint for listing and creating staff members.

Supports both GET (list all staff) and POST (create new staff) operations.
Requires authentication and staff permissions. Handles multipart/form data
for file uploads (e.g., profile pictures).`,
    requestFormat: 'json',
    response: z.array(Staff),
  },
  {
    method: 'post',
    path: '/accounts/api/staff/',
    alias: 'accounts_api_staff_create',
    description: `API endpoint for listing and creating staff members.

Supports both GET (list all staff) and POST (create new staff) operations.
Requires authentication and staff permissions. Handles multipart/form data
for file uploads (e.g., profile pictures).`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: Staff,
      },
    ],
    response: Staff,
  },
  {
    method: 'get',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_retrieve',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'put',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_update',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: Staff,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'patch',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_partial_update',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedStaff,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'delete',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_destroy',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/accounts/api/staff/all/',
    alias: 'accounts_api_staff_all_list',
    description: `API endpoint for retrieving list of staff members for Kanban board.

Supports filtering to return only actual users (excluding system/test accounts)
based on the &#x27;actual_users&#x27; query parameter.`,
    requestFormat: 'json',
    response: z.array(KanbanStaff),
  },
  {
    method: 'post',
    path: '/accounts/api/token/',
    alias: 'accounts_api_token_create',
    description: `Obtains JWT tokens for authentication. When ENABLE_JWT_AUTH&#x3D;True, tokens are set as httpOnly cookies, and the response body will be an empty object (schema: EmptySerializer). Otherwise, the response body will contain the tokens (schema: TokenObtainPairResponseSerializer). Also checks if the user needs to reset their password.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CustomTokenObtainPair,
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 401,
        schema: z.unknown(),
      },
    ],
  },
  {
    method: 'post',
    path: '/accounts/api/token/refresh/',
    alias: 'accounts_api_token_refresh_create',
    description: `Refreshes the JWT access token using a refresh token. When ENABLE_JWT_AUTH&#x3D;True, the new access token is set as an httpOnly cookie and removed from the JSON response (schema: EmptySerializer). Otherwise, the response contains the new access token (schema: TokenRefreshResponseSerializer).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TokenRefresh,
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 401,
        schema: z.unknown(),
      },
    ],
  },
  {
    method: 'post',
    path: '/accounts/api/token/verify/',
    alias: 'accounts_api_token_verify_create',
    description: `Takes a token and indicates if it is valid.  This view provides no
information about a token&#x27;s fitness for a particular use.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ token: z.string() }).passthrough(),
      },
    ],
    response: z.object({ token: z.string() }).passthrough(),
  },
  {
    method: 'post',
    path: '/accounts/logout/',
    alias: 'accounts_logout_create',
    description: `Custom logout view that clears JWT httpOnly cookies`,
    requestFormat: 'json',
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 500,
        schema: z.object({}).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/accounts/me/',
    alias: 'accounts_me_retrieve',
    description: `Get current authenticated user information via JWT from httpOnly cookie`,
    requestFormat: 'json',
    response: UserProfile,
  },
  {
    method: 'post',
    path: '/api/aws/instance/reboot/',
    alias: 'api_aws_instance_reboot_create',
    description: `Reboot the UAT instance`,
    requestFormat: 'json',
    response: AWSInstanceStatusResponse,
  },
  {
    method: 'post',
    path: '/api/aws/instance/start/',
    alias: 'api_aws_instance_start_create',
    description: `Start the UAT instance`,
    requestFormat: 'json',
    response: AWSInstanceStatusResponse,
  },
  {
    method: 'get',
    path: '/api/aws/instance/status/',
    alias: 'api_aws_instance_status_retrieve',
    description: `Get current status of the UAT instance`,
    requestFormat: 'json',
    response: AWSInstanceStatusResponse,
  },
  {
    method: 'post',
    path: '/api/aws/instance/stop/',
    alias: 'api_aws_instance_stop_create',
    description: `Stop the UAT instance`,
    requestFormat: 'json',
    response: AWSInstanceStatusResponse,
  },
  {
    method: 'get',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_retrieve',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    response: CompanyDefaults,
  },
  {
    method: 'put',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_update',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CompanyDefaults,
      },
    ],
    response: CompanyDefaults,
  },
  {
    method: 'patch',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_partial_update',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedCompanyDefaults,
      },
    ],
    response: CompanyDefaults,
  },
  {
    method: 'get',
    path: '/api/workflow/ai-providers/',
    alias: 'api_workflow_ai_providers_list',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    response: z.array(AIProvider),
  },
  {
    method: 'post',
    path: '/api/workflow/ai-providers/',
    alias: 'api_workflow_ai_providers_create',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProviderCreateUpdate,
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'get',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_retrieve',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProvider,
  },
  {
    method: 'put',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_update',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProviderCreateUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'patch',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_partial_update',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedAIProviderCreateUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'delete',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_destroy',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/api/workflow/ai-providers/:id/set-default/',
    alias: 'api_workflow_ai_providers_set_default_create',
    description: `Set this provider as the default for the company.
This will atomically unset any other provider that is currently the default
for the same company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProvider,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProvider,
  },
  {
    method: 'get',
    path: '/api/workflow/app-errors/',
    alias: 'api_workflow_app_errors_list',
    description: `ViewSet for AppError with filtering capabilities and resolution actions.

Provides list, retrieve, and resolution management for application errors.
Includes comprehensive filtering and search capabilities for error analysis.

Endpoints:
- GET /api/app-errors/
- GET /api/app-errors/&lt;id&gt;/
- POST /api/app-errors/&lt;id&gt;/mark_resolved/
- POST /api/app-errors/&lt;id&gt;/mark_unresolved/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'app',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'app__icontains',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'file',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'file__icontains',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'function',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'function__icontains',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'job_id',
        type: 'Query',
        schema: z.string().uuid().optional(),
      },
      {
        name: 'ordering',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'resolved',
        type: 'Query',
        schema: z.boolean().optional(),
      },
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'severity',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'severity__gte',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'severity__lte',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'timestamp__gte',
        type: 'Query',
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: 'timestamp__lte',
        type: 'Query',
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: 'user_id',
        type: 'Query',
        schema: z.string().uuid().optional(),
      },
    ],
    response: PaginatedAppErrorList,
  },
  {
    method: 'get',
    path: '/api/workflow/app-errors/:id/',
    alias: 'api_workflow_app_errors_retrieve',
    description: `ViewSet for AppError with filtering capabilities and resolution actions.

Provides list, retrieve, and resolution management for application errors.
Includes comprehensive filtering and search capabilities for error analysis.

Endpoints:
- GET /api/app-errors/
- GET /api/app-errors/&lt;id&gt;/
- POST /api/app-errors/&lt;id&gt;/mark_resolved/
- POST /api/app-errors/&lt;id&gt;/mark_unresolved/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AppError,
  },
  {
    method: 'post',
    path: '/api/workflow/app-errors/:id/mark_resolved/',
    alias: 'api_workflow_app_errors_mark_resolved_create',
    description: `Mark an error as resolved.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AppError,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AppError,
  },
  {
    method: 'post',
    path: '/api/workflow/app-errors/:id/mark_unresolved/',
    alias: 'api_workflow_app_errors_mark_unresolved_create',
    description: `Mark an error as unresolved.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AppError,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AppError,
  },
  {
    method: 'post',
    path: '/api/xero/create_invoice/:job_id',
    alias: 'api_xero_create_invoice_create',
    description: `Creates an invoice in Xero for the specified job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 400,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/xero/create_purchase_order/:purchase_order_id',
    alias: 'api_xero_create_purchase_order_create',
    description: `Creates or updates a Purchase Order in Xero.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 400,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/xero/create_quote/:job_id',
    alias: 'api_xero_create_quote_create',
    description: `Creates a quote in Xero for the specified job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/xero/delete_invoice/:job_id',
    alias: 'api_xero_delete_invoice_destroy',
    description: `Deletes a specific invoice in Xero for a given job, identified by its Xero ID.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'xero_invoice_id',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 400,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/xero/delete_purchase_order/:purchase_order_id',
    alias: 'api_xero_delete_purchase_order_destroy',
    description: `Deletes a purchase order in Xero for the specified purchase order`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/xero/delete_quote/:job_id',
    alias: 'api_xero_delete_quote_destroy',
    description: `Deletes a quote in Xero for the specified job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroDocumentSuccessResponse,
    errors: [
      {
        status: 404,
        schema: XeroDocumentErrorResponse,
      },
      {
        status: 500,
        schema: XeroDocumentErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/app-errors/',
    alias: 'app_errors_list',
    description: `API view for listing application errors.

Returns a paginated list of all AppError records ordered by timestamp
(most recent first). Includes filtering capabilities for debugging and
monitoring application issues.

Endpoint: /api/app-errors/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'app',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'job_id',
        type: 'Query',
        schema: z.string().uuid().optional(),
      },
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'resolved',
        type: 'Query',
        schema: z.boolean().optional(),
      },
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'severity',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'user_id',
        type: 'Query',
        schema: z.string().uuid().optional(),
      },
    ],
    response: PaginatedAppErrorList,
  },
  {
    method: 'get',
    path: '/app-errors/:id/',
    alias: 'app_errors_retrieve',
    description: `API view for retrieving a single application error.

Returns detailed information about a specific AppError record
including error message, context, location, and resolution status.
Used for investigating specific application failures.

Endpoint: /api/app-errors/&lt;id&gt;/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AppError,
  },
  {
    method: 'get',
    path: '/clients/:client_id/contacts/',
    alias: 'clients_contacts_retrieve',
    description: `Retrieve all contacts for a specific client.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'client_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ClientContactResponse,
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 404,
        schema: ClientErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/clients/all/',
    alias: 'clients_all_list',
    description: `Returns a list of all clients with basic information (id and name) for dropdowns and search.`,
    requestFormat: 'json',
    response: z.array(ClientNameOnly),
    errors: [
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/clients/contacts/',
    alias: 'clients_contacts_create',
    description: `Create a new client contact.

Expected JSON:
{
    &quot;client_id&quot;: &quot;uuid-of-client&quot;,
    &quot;name&quot;: &quot;Contact Name&quot;,
    &quot;email&quot;: &quot;contact@example.com&quot;,
    &quot;phone&quot;: &quot;123-456-7890&quot;,
    &quot;position&quot;: &quot;Job Title&quot;,
    &quot;is_primary&quot;: false,
    &quot;notes&quot;: &quot;Additional notes&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ClientContactCreateRequest,
      },
    ],
    response: ClientContactCreateResponse,
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/clients/create/',
    alias: 'clients_create_create',
    description: `Creates a new client in Xero first, then syncs locally. Requires valid Xero authentication.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ClientCreateRequest,
      },
    ],
    response: ClientCreateResponse,
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 401,
        schema: ClientErrorResponse,
      },
      {
        status: 409,
        schema: ClientDuplicateErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/clients/search/',
    alias: 'clients_search_retrieve',
    description: `Searches clients by name following early return pattern.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'limit',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'q',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: ClientSearchResponse,
    errors: [
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/api/job-files/',
    alias: 'retrieveJobFilesApi',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/api/job-files/',
    alias: 'uploadJobFilesApi',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/api/job-files/',
    alias: 'updateJobFilesApi',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/api/job-files/',
    alias: 'deleteJobFilesApi',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/api/job-files/:file_path',
    alias: 'retrieveJobFilesApi_2',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/api/job-files/:file_path',
    alias: 'uploadJobFilesApi_2',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/api/job-files/:file_path',
    alias: 'updateJobFilesApi_2',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/api/job-files/:file_path',
    alias: 'deleteJobFilesApi_2',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/api/job-files/:job_number',
    alias: 'retrieveJobFilesApi_3',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/api/job-files/:job_number',
    alias: 'uploadJobFilesApi_3',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/api/job-files/:job_number',
    alias: 'updateJobFilesApi_3',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/api/job-files/:job_number',
    alias: 'deleteJobFilesApi_3',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/api/job/:job_id/assignment',
    alias: 'job_api_job_assignment_create',
    description: `API Endpoint for activities related to job assignment`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AssignJobRequest,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AssignJobResponse,
  },
  {
    method: 'delete',
    path: '/job/api/job/:job_id/assignment',
    alias: 'job_api_job_assignment_destroy',
    description: `API Endpoint for activities related to job assignment`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AssignJobResponse,
  },
  {
    method: 'get',
    path: '/job/api/job/completed/',
    alias: 'job_api_job_completed_list',
    description: `API Endpoint to provide Job data for archiving display`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: PaginatedCompleteJobList,
  },
  {
    method: 'post',
    path: '/job/api/job/completed/archive',
    alias: 'job_api_job_completed_archive_create',
    description: `API Endpoint to set &#x27;paid&#x27; flag as True in the received jobs`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ArchiveJobsRequest,
      },
    ],
    response: ArchiveJobsRequest,
  },
  {
    method: 'get',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_retrieve',
    description: `Load all chat messages for a specific job.

Response format matches job_quote_chat_plan.md specification.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobQuoteChatHistoryResponse,
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_create',
    description: `Save a new chat message (user or assistant).

Expected JSON:
{
    &quot;message_id&quot;: &quot;user-1234567892&quot;,
    &quot;role&quot;: &quot;user&quot;,
    &quot;content&quot;: &quot;Actually, make that 5 boxes instead&quot;,
    &quot;metadata&quot;: {}
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobQuoteChat,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobQuoteChat,
  },
  {
    method: 'delete',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_destroy',
    description: `Delete all chat messages for a job (start fresh).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'patch',
    path: '/job/api/jobs/:job_id/quote-chat/:message_id/',
    alias: 'job_api_jobs_quote_chat_partial_update',
    description: `Update an existing message (useful for streaming responses).

Expected JSON:
{
    &quot;content&quot;: &quot;Updated message content&quot;,
    &quot;metadata&quot;: {&quot;final&quot;: true}
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ content: z.string(), metadata: z.unknown() }).partial().passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'message_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.object({ content: z.string(), metadata: z.unknown() }).partial().passthrough(),
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/quote-chat/interaction/',
    alias: 'job_api_jobs_quote_chat_interaction_create',
    description: `Receives a user message, sends it to the MCPChatService for processing,
and returns the AI&#x27;s final response.

The frontend is expected to first save the user&#x27;s message via the
JobQuoteChatHistoryView, and then call this endpoint to get the
assistant&#x27;s reply.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ message: z.string().max(5000) }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ message: z.string().max(5000) }).passthrough(),
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/reorder/',
    alias: 'job_api_jobs_reorder_create',
    description: `Reorder a job within or between kanban columns.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobReorderRequest,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: KanbanSuccessResponse,
    errors: [
      {
        status: 400,
        schema: KanbanErrorResponse,
      },
      {
        status: 404,
        schema: KanbanErrorResponse,
      },
      {
        status: 500,
        schema: KanbanErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/update-status/',
    alias: 'job_api_jobs_update_status_create',
    description: `Update the status of a job on the Kanban board.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ status: z.string() }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: KanbanSuccessResponse,
    errors: [
      {
        status: 400,
        schema: KanbanErrorResponse,
      },
      {
        status: 404,
        schema: KanbanErrorResponse,
      },
      {
        status: 500,
        schema: KanbanErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/api/jobs/advanced-search/',
    alias: 'job_api_jobs_advanced_search_retrieve',
    description: `Endpoint for advanced job search - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'client_name',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'contact_person',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'created_after',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'created_before',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'created_by',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'description',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'job_number',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'name',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'paid',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'xero_invoice_params',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: AdvancedSearchResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch-all/',
    alias: 'job_api_jobs_fetch_all_retrieve',
    description: `Fetch all jobs for Kanban board - API endpoint.`,
    requestFormat: 'json',
    response: FetchAllJobsResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch-by-column/:column_id/',
    alias: 'job_api_jobs_fetch_by_column_retrieve',
    description: `Fetch jobs by kanban column using new categorization system.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'column_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: FetchJobsByColumnResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch/:status/',
    alias: 'job_api_jobs_fetch_retrieve',
    description: `Fetch jobs by status with optional search - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'status',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: FetchJobsResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/status-values/',
    alias: 'job_api_jobs_status_values_retrieve',
    description: `Return available status values for Kanban - API endpoint.`,
    requestFormat: 'json',
    response: FetchStatusValuesResponse,
  },
  {
    method: 'get',
    path: '/job/job/:job_id/workshop-pdf/',
    alias: 'job_job_workshop_pdf_retrieve',
    description: `Generate and return a workshop PDF for printing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: WorkshopPDFResponse,
  },
  {
    method: 'patch',
    path: '/job/rest/cost_lines/:cost_line_id/',
    alias: 'job_rest_cost_lines_partial_update',
    description: `Update a cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedCostLineCreateUpdate,
      },
      {
        name: 'cost_line_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: CostLineCreateUpdate,
  },
  {
    method: 'delete',
    path: '/job/rest/cost_lines/:cost_line_id/delete/',
    alias: 'job_rest_cost_lines_delete_destroy',
    description: `Delete an existing CostLine by ID`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'cost_line_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 500,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/',
    alias: 'job_rest_jobs_create',
    description: `Create a new Job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobCreateRequest,
      },
    ],
    response: JobCreateResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:id/cost_sets/:kind/',
    alias: 'job_rest_jobs_cost_sets_retrieve',
    description: `Get the latest CostSet for a job by kind.

Args:
    pk: Job primary key (UUID)
    kind: CostSet kind (&#x27;estimate&#x27;, &#x27;quote&#x27;, or &#x27;actual&#x27;)

Returns:
    Response: Serialized CostSet data or 404`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'kind',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: CostSet,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:id/quote/apply/',
    alias: 'job_rest_jobs_quote_apply_create',
    description: `Apply quote import from linked Google Sheet.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/apply/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ApplyQuoteResponse,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ApplyQuoteResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:id/quote/link/',
    alias: 'job_rest_jobs_quote_link_create',
    description: `Link a job to a Google Sheets quote template.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/link/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ template_url: z.string().url() }).partial().passthrough(),
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ template_url: z.string().url() }).partial().passthrough(),
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:id/quote/preview/',
    alias: 'job_rest_jobs_quote_preview_create',
    description: `Preview quote import from linked Google Sheet.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/preview/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PreviewQuoteResponse,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PreviewQuoteResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_retrieve',
    description: `Fetch complete job data including financial information`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDetailResponse,
  },
  {
    method: 'put',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_update',
    description: `Update Job data (autosave).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobDetailResponse,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDetailResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_destroy',
    description: `Delete a Job if permitted.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDeleteResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/:kind/cost_lines/',
    alias: 'job_rest_jobs_cost_sets_cost_lines_create',
    description: `Create a new cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CostLineCreateUpdate,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'kind',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: CostLineCreateUpdate,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/actual/cost_lines/',
    alias: 'job_rest_jobs_cost_sets_actual_cost_lines_create',
    description: `Create a new cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CostLineCreateUpdate,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: CostLineCreateUpdate,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/cost_sets/quote/revise/',
    alias: 'job_rest_jobs_cost_sets_quote_revise_retrieve',
    description: `Returns a list of archived quote revisions for the specified job. Each revision contains summary and cost line data as archived at the time of revision.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteRevisionsList,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/quote/revise/',
    alias: 'job_rest_jobs_cost_sets_quote_revise_create',
    description: `Archives the current quote cost lines and summary for the specified job, clears all current cost lines from the quote CostSet, and starts a new quote revision. Returns details of the archived revision and status.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z
          .object({ reason: z.string().max(500) })
          .partial()
          .passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteRevisionResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/events/',
    alias: 'job_rest_jobs_events_create',
    description: `Add a manual event to the Job with duplicate prevention.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ description: z.string().max(500) }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobEventCreateResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 409,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 429,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/quote/accept/',
    alias: 'job_rest_jobs_quote_accept_create',
    description: `Accept a quote for the job. Sets the quote_acceptance_date to current datetime.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobQuoteAcceptance,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobQuoteAcceptance,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/quote/status/',
    alias: 'job_rest_jobs_quote_status_retrieve',
    description: `Get quote status for job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteImportStatusResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/workshop-pdf/',
    alias: 'job_rest_jobs_workshop_pdf_retrieve',
    description: `Generate and return a workshop PDF for printing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: WorkshopPDFResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/',
    alias: 'retrieveJobFilesApi_4',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/',
    alias: 'uploadJobFilesApi_4',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/',
    alias: 'updateJobFilesApi_4',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/',
    alias: 'deleteJobFilesApi_4',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:file_id/thumbnail/',
    alias: 'getJobFileThumbnail',
    description: `API view for serving JPEG thumbnails of job files.

This view generates and serves thumbnail images for job files that
support thumbnail generation (typically image files). Thumbnails are
cached on disk and served via file response for efficient delivery.

GET: Returns a JPEG thumbnail for the specified file ID, or 404 if
     the thumbnail doesn&#x27;t exist or cannot be generated.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobFileThumbnailErrorResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'retrieveJobFilesApi_5',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'uploadJobFilesApi_5',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'updateJobFilesApi_5',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'deleteJobFilesApi_5',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'retrieveJobFilesApi_6',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.array(JobFile),
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'uploadJobFilesApi_6',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUploadSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'updateJobFilesApi_6',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
    errors: [
      {
        status: 400,
        schema: JobFileErrorResponse,
      },
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'deleteJobFilesApi_6',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        schema: JobFileErrorResponse,
      },
      {
        status: 500,
        schema: JobFileErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/upload/',
    alias: 'uploadJobFilesRest',
    description: `REST API view for uploading files to jobs.

Handles multipart file uploads, saves files to the Dropbox workflow folder,
and creates JobFile database records with proper file metadata.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadViewResponse,
      },
    ],
    response: JobFileUploadViewResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/weekly-metrics/',
    alias: 'job_rest_jobs_weekly_metrics_list',
    description: `Fetch weekly metrics data for jobs with time entries in the specified week.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'week',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(WeeklyMetrics),
  },
  {
    method: 'get',
    path: '/job/rest/month-end/',
    alias: 'job_rest_month_end_retrieve',
    description: `REST API view for month-end processing of special jobs and stock data.

GET: Returns special jobs data and stock job information for month-end review
POST: Processes selected jobs for month-end archiving and status updates`,
    requestFormat: 'json',
    response: MonthEndGetResponse,
  },
  {
    method: 'post',
    path: '/job/rest/month-end/',
    alias: 'job_rest_month_end_create',
    description: `REST API view for month-end processing of special jobs and stock data.

GET: Returns special jobs data and stock job information for month-end review
POST: Processes selected jobs for month-end archiving and status updates`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: MonthEndPostResponse,
      },
    ],
    response: MonthEndPostResponse,
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/entries/',
    alias: 'job_rest_timesheet_entries_retrieve',
    description: `Fetches all timesheet entries (CostLines) for a specific staff member and date.`,
    requestFormat: 'json',
    response: ModernTimesheetEntryGetResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 404,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 500,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/job/rest/timesheet/entries/',
    alias: 'job_rest_timesheet_entries_create',
    description: `Creates a new timesheet entry for a staff member on a specific date.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ModernTimesheetEntryPostRequest,
      },
    ],
    response: ModernTimesheetEntryPostResponse,
    errors: [
      {
        status: 400,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 404,
        schema: z.object({ error: z.string() }).passthrough(),
      },
      {
        status: 500,
        schema: z.object({ error: z.string() }).passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/jobs/:job_id/',
    alias: 'job_rest_timesheet_jobs_retrieve',
    description: `Get all timesheet cost lines for a job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ModernTimesheetJobGetResponse,
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/staff/:staff_id/date/:entry_date/',
    alias: 'job_rest_timesheet_staff_date_retrieve',
    description: `Get all cost lines for a staff member on a specific date`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'entry_date',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ModernTimesheetDayGetResponse,
  },
  {
    method: 'post',
    path: '/purchasing/api/delivery-receipts/process/',
    alias: 'purchasing_api_delivery_receipts_process_create',
    description: `REST API view for processing delivery receipts.

POST: Processes delivery receipt for a purchase order with stock allocations`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DeliveryReceiptRequest,
      },
    ],
    response: DeliveryReceiptResponse,
    errors: [
      {
        status: 400,
        schema: DeliveryReceiptResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/purchasing/api/purchase-orders/:purchase_order_id/email/',
    alias: 'purchasing_api_purchase_orders_email_create',
    description: `Generate and return email details for the specified purchase order.

Args:
    request: The HTTP request
    purchase_order_id: UUID of the purchase order

Returns:
    Response: Email details if successful
    Response: Error details if unsuccessful`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PurchaseOrderEmailRequest,
      },
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderEmailRequest,
  },
  {
    method: 'get',
    path: '/purchasing/api/purchase-orders/:purchase_order_id/pdf/',
    alias: 'purchasing_api_purchase_orders_pdf_retrieve',
    description: `Generate and return a PDF for the specified purchase order.

Args:
    request: The HTTP request
    purchase_order_id: UUID of the purchase order

Returns:
    FileResponse: PDF file if successful
    Response: Error details if unsuccessful`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderPDFResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/all-jobs/',
    alias: 'purchasing_rest_all_jobs_retrieve',
    description: `Get all jobs with stock holding job flag.`,
    requestFormat: 'json',
    response: AllJobsResponse,
  },
  {
    method: 'post',
    path: '/purchasing/rest/delivery-receipts/',
    alias: 'purchasing_rest_delivery_receipts_create',
    description: `REST API view for processing delivery receipts.

POST: Processes delivery receipt for a purchase order with stock allocations`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DeliveryReceiptRequest,
      },
    ],
    response: DeliveryReceiptResponse,
    errors: [
      {
        status: 400,
        schema: DeliveryReceiptResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/purchasing/rest/jobs/',
    alias: 'purchasing_rest_jobs_retrieve',
    description: `Get list of jobs suitable for purchasing operations.`,
    requestFormat: 'json',
    response: PurchasingJobsResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/',
    alias: 'listPurchaseOrders',
    description: `Get list of purchase orders with optional status filtering.`,
    requestFormat: 'json',
    response: z.array(PurchaseOrderList),
    errors: [
      {
        status: 400,
        schema: z.object({}).partial().passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/purchasing/rest/purchase-orders/',
    alias: 'purchasing_rest_purchase_orders_create',
    description: `Create new purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PurchaseOrderCreate,
      },
    ],
    response: PurchaseOrderCreate,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/:id/',
    alias: 'retrievePurchaseOrder',
    description: `Get purchase order details including lines.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderDetail,
  },
  {
    method: 'patch',
    path: '/purchasing/rest/purchase-orders/:id/',
    alias: 'purchasing_rest_purchase_orders_partial_update',
    description: `Update purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedPurchaseOrderUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderUpdate,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/:po_id/allocations/',
    alias: 'purchasing_rest_purchase_orders_allocations_retrieve',
    description: `Get existing allocations for a purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'po_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderAllocationsResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/:po_id/allocations/:allocation_type/:allocation_id/details/',
    alias: 'getAllocationDetails',
    description: `Get details about a specific allocation before deletion.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'allocation_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'allocation_type',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'po_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AllocationDetailsResponse,
    errors: [
      {
        status: 404,
        schema: z.object({}).partial().passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/purchasing/rest/purchase-orders/:po_id/lines/:line_id/allocations/delete/',
    alias: 'deleteAllocation',
    description: `Delete a specific allocation (Stock item or CostLine) from a purchase order line.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AllocationDeleteRequest,
      },
      {
        name: 'line_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'po_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AllocationDeleteResponse,
    errors: [
      {
        status: 400,
        schema: AllocationDeleteResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/purchasing/rest/stock/',
    alias: 'purchasing_rest_stock_retrieve',
    description: `Get list of all active stock items.`,
    requestFormat: 'json',
    response: StockList,
  },
  {
    method: 'post',
    path: '/purchasing/rest/stock/',
    alias: 'purchasing_rest_stock_create',
    description: `Create new stock item.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: StockCreate,
      },
    ],
    response: StockCreate,
  },
  {
    method: 'delete',
    path: '/purchasing/rest/stock/:stock_id/',
    alias: 'purchasing_rest_stock_destroy',
    description: `REST API view for deactivating stock items.

DELETE: Marks a stock item as inactive instead of deleting it`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'stock_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/purchasing/rest/stock/:stock_id/consume/',
    alias: 'consumeStock',
    description: `Consume stock for a job, reducing available quantity.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: StockConsumeRequest,
      },
      {
        name: 'stock_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: StockConsumeResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/xero-items/',
    alias: 'purchasing_rest_xero_items_retrieve',
    description: `Return list of items from Xero.`,
    requestFormat: 'json',
    response: XeroItemListResponse,
  },
  {
    method: 'get',
    path: '/quoting/api/django-job-executions/',
    alias: 'quoting_api_django_job_executions_list',
    requestFormat: 'json',
    parameters: [
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(DjangoJobExecution),
  },
  {
    method: 'get',
    path: '/quoting/api/django-job-executions/:id/',
    alias: 'quoting_api_django_job_executions_retrieve',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: DjangoJobExecution,
  },
  {
    method: 'get',
    path: '/quoting/api/django-jobs/',
    alias: 'quoting_api_django_jobs_list',
    requestFormat: 'json',
    parameters: [
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(DjangoJob),
  },
  {
    method: 'post',
    path: '/quoting/api/django-jobs/',
    alias: 'quoting_api_django_jobs_create',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DjangoJob,
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'get',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_retrieve',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'put',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_update',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DjangoJob,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'patch',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_partial_update',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedDjangoJob,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'delete',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_destroy',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/timesheets/api/daily/',
    alias: 'getDailyTimesheetSummaryByDate',
    description: `Get daily timesheet summary for all staff

Args:
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with daily timesheet data`,
    requestFormat: 'json',
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/daily/:target_date/',
    alias: 'getDailyTimesheetSummaryByDate_2',
    description: `Get daily timesheet summary for all staff

Args:
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with daily timesheet data`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'target_date',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/jobs/',
    alias: 'timesheets_api_jobs_retrieve',
    description: `Get list of active jobs for timesheet entries using CostSet system.`,
    requestFormat: 'json',
    response: JobsListResponse,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/',
    alias: 'timesheets_api_staff_retrieve',
    description: `Get filtered list of staff members for a specific date.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'date',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: StaffListResponse,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/:staff_id/daily/',
    alias: 'getStaffDailyTimesheetDetailByDate',
    description: `Get detailed timesheet data for a specific staff member

Args:
    staff_id: Staff member ID
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with staff timesheet detail`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/:staff_id/daily/:target_date/',
    alias: 'getStaffDailyTimesheetDetailByDate_2',
    description: `Get detailed timesheet data for a specific staff member

Args:
    staff_id: Staff member ID
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with staff timesheet detail`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'target_date',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/weekly/',
    alias: 'timesheets_api_weekly_retrieve',
    description: `Return Monday-to-Friday weekly timesheet data.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'start_date',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: WeeklyTimesheetData,
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/timesheets/api/weekly/',
    alias: 'timesheets_api_weekly_create',
    description: `Submit paid absence request.

Expected payload:
{
    &quot;staff_id&quot;: &quot;uuid&quot;,
    &quot;start_date&quot;: &quot;YYYY-MM-DD&quot;,
    &quot;end_date&quot;: &quot;YYYY-MM-DD&quot;,
    &quot;leave_type&quot;: &quot;annual|sick|other&quot;,
    &quot;hours_per_day&quot;: 8.0,
    &quot;description&quot;: &quot;Optional description&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({}).partial().passthrough(),
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/timesheets/api/weekly/ims/',
    alias: 'timesheets_api_weekly_ims_retrieve',
    description: `Return IMS-formatted weekly timesheet data.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'start_date',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: IMSWeeklyTimesheetData,
    errors: [
      {
        status: 400,
        schema: ClientErrorResponse,
      },
      {
        status: 500,
        schema: ClientErrorResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/xero-errors/',
    alias: 'xero_errors_list',
    description: `API view for listing Xero synchronization errors.

Returns a paginated list of all XeroError records ordered by timestamp
(most recent first). Useful for monitoring and debugging Xero integration
issues.

Endpoint: /api/xero/errors/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: PaginatedXeroErrorList,
  },
  {
    method: 'get',
    path: '/xero-errors/:id/',
    alias: 'xero_errors_retrieve',
    description: `API view for retrieving a single Xero synchronization error.

Returns detailed information about a specific XeroError record
including error message, context, and timestamp. Used for investigating
specific Xero integration failures.

Endpoint: /api/xero/errors/&lt;id&gt;/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroError,
  },
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}

export { endpoints }
