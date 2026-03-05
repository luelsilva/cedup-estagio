import { pgTable, uuid, text, timestamp, boolean, pgEnum, serial, smallint, varchar, integer, jsonb, bigint, date } from 'drizzle-orm/pg-core';

// Enum para tipos de OTP
export const otpTypeEnum = pgEnum('otp_type', ['registration', 'password_reset']);

// Enum para roles de usuário
export const userRolesEnum = pgEnum('user_role', ['generic', 'student', 'company', 'teacher', 'admin', 'sudo']);

// Tabela de perfis de usuários
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name'),
    roles: userRolesEnum('roles').default('generic').notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// Tabela de códigos OTP
export const otpCodes = pgTable('otp_codes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    type: otpTypeEnum('type').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Tabela de refresh tokens
export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isRevoked: boolean('is_revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});


export const menuSections = pgTable('menu_sections', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: smallint('code').notNull().unique(),
    caption: text('caption').notNull(),
    colorDark: varchar('color_dark', { length: 7 }).notNull(),
    colorLight: varchar('color_light', { length: 7 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const menuItems = pgTable('menu_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: smallint('section_id').notNull().references(() => menuSections.code, { onDelete: 'cascade', onUpdate: 'cascade' }),
    model: varchar('model', { length: 10 }).notNull().unique(),
    caption: text('caption').notNull(),
    link: text('link'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const courses = pgTable('courses', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    sigla: varchar('sigla', { length: 10 }).notNull().unique(),
    shortName: varchar('short_name', { length: 40 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const teachers = pgTable('teachers', {
    id: uuid('id').primaryKey().defaultRandom(),
    registration: varchar('registration', { length: 20 }).notNull().unique(),
    name: text('name').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const courseTeachers = pgTable('course_teachers', {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    teacherId: uuid('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const keepAlive = pgTable('keep_alive', {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});


export const formModels = pgTable('form_models', {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: varchar('model_id', { length: 50 }).notNull().unique(),
    bgColor: varchar('bg_color', { length: 7 }),
    cardBgColor: varchar('card_bg_color', { length: 7 }),
    title: text('title').notNull(),
    description: text('description'),
    titleColor: varchar('title_color', { length: 7 }),
    googleDocsId: varchar('google_docs_id', { length: 100 }),
    config: jsonb('config').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const internships = pgTable('internships', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    studentRegistration: bigint('student_registration', { mode: 'number' }),
    studentName: text('student_name').notNull(),
    courseSigla: text('course_sigla').notNull(),
    companyName: text('company_name').notNull(),
    companyCnpj: text('company_cnpj').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    jsonData: jsonb('json_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    lastModifiedBy: uuid('last_modified_by').references(() => profiles.id, { onDelete: 'set null' })
});
