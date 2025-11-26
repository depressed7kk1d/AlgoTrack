--
-- PostgreSQL database dump
--

\restrict pEpF0Bqk8fjHJGUzMsxDnBmoaIgxd8vzbNft1MOCiRymHUD45hvpIaOOqws2H12

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActivityLevel; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."ActivityLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'VERY_HIGH'
);


ALTER TYPE public."ActivityLevel" OWNER TO algotrack;

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SENT',
    'FAILED'
);


ALTER TYPE public."MessageStatus" OWNER TO algotrack;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."MessageType" AS ENUM (
    'CLASS_SUMMARY',
    'PERSONAL_OS'
);


ALTER TYPE public."MessageType" OWNER TO algotrack;

--
-- Name: Mood; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."Mood" AS ENUM (
    'HAPPY',
    'INTERESTED',
    'NEUTRAL',
    'TIRED',
    'DISTRACTED'
);


ALTER TYPE public."Mood" OWNER TO algotrack;

--
-- Name: ParentType; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."ParentType" AS ENUM (
    'CALM',
    'ANXIOUS',
    'DEMANDING'
);


ALTER TYPE public."ParentType" OWNER TO algotrack;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'DRAFT',
    'GENERATED',
    'SENT'
);


ALTER TYPE public."ReportStatus" OWNER TO algotrack;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: algotrack
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'TEACHER'
);


ALTER TYPE public."UserRole" OWNER TO algotrack;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO algotrack;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.admins (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'ADMIN'::public."UserRole" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admins OWNER TO algotrack;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    actor_id text NOT NULL,
    actor_type text NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO algotrack;

--
-- Name: cards; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.cards (
    id text NOT NULL,
    lesson_id text NOT NULL,
    student_id text NOT NULL,
    activity_level public."ActivityLevel" NOT NULL,
    skills jsonb NOT NULL,
    mood public."Mood" NOT NULL,
    notes text NOT NULL,
    recommendation text,
    percent_completion double precision DEFAULT 0 NOT NULL,
    task_completed_count integer DEFAULT 0,
    task_total_for_lesson integer DEFAULT 1,
    external_project_link text,
    created_by_teacher_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    edited_at timestamp(3) without time zone,
    edited_by_teacher_id text
);


ALTER TABLE public.cards OWNER TO algotrack;

--
-- Name: class_students; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.class_students (
    id text NOT NULL,
    class_id text NOT NULL,
    student_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.class_students OWNER TO algotrack;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.classes (
    id text NOT NULL,
    name text NOT NULL,
    teacher_id text NOT NULL,
    schedule text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.classes OWNER TO algotrack;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.lessons (
    id text NOT NULL,
    module_id text NOT NULL,
    class_id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    topic text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lessons OWNER TO algotrack;

--
-- Name: message_queue; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.message_queue (
    id text NOT NULL,
    type public."MessageType" NOT NULL,
    payload jsonb NOT NULL,
    status public."MessageStatus" DEFAULT 'PENDING'::public."MessageStatus" NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone
);


ALTER TABLE public.message_queue OWNER TO algotrack;

--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.message_templates (
    id text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    variables jsonb,
    parent_type public."ParentType",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.message_templates OWNER TO algotrack;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.modules (
    id text NOT NULL,
    class_id text NOT NULL,
    title text NOT NULL,
    lessons_count integer DEFAULT 4 NOT NULL,
    total_tasks integer DEFAULT 8 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.modules OWNER TO algotrack;

--
-- Name: os_reports; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.os_reports (
    id text NOT NULL,
    module_id text NOT NULL,
    student_id text NOT NULL,
    generated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    report_html text NOT NULL,
    report_pdf_url text,
    status public."ReportStatus" DEFAULT 'DRAFT'::public."ReportStatus" NOT NULL,
    sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.os_reports OWNER TO algotrack;

--
-- Name: parent_links; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.parent_links (
    id text NOT NULL,
    student_id text NOT NULL,
    link_token text NOT NULL,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.parent_links OWNER TO algotrack;

--
-- Name: parents; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.parents (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    parent_type public."ParentType" DEFAULT 'CALM'::public."ParentType" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.parents OWNER TO algotrack;

--
-- Name: students; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.students (
    id text NOT NULL,
    name text NOT NULL,
    dob timestamp(3) without time zone,
    avatar text,
    parent_id text NOT NULL,
    external_project_link text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.students OWNER TO algotrack;

--
-- Name: teachers; Type: TABLE; Schema: public; Owner: algotrack
--

CREATE TABLE public.teachers (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    password text NOT NULL,
    avatar text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teachers OWNER TO algotrack;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.admins (id, name, email, password, role, created_at, updated_at) FROM stdin;
cmielcu8e000023bor1vuxmsz	Администратор	admin@algoschool.org	$2b$10$Ww4MNy.4f93rsHQcmlG0vuBJ.Gzeb7oU/d5Veu85gC1UTp26ldONC	ADMIN	2025-11-25 13:08:09.614	2025-11-25 13:08:09.614
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.audit_logs (id, actor_id, actor_type, action, details, created_at) FROM stdin;
\.


--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.cards (id, lesson_id, student_id, activity_level, skills, mood, notes, recommendation, percent_completion, task_completed_count, task_total_for_lesson, external_project_link, created_by_teacher_id, created_at, edited_at, edited_by_teacher_id) FROM stdin;
\.


--
-- Data for Name: class_students; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.class_students (id, class_id, student_id, created_at) FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.classes (id, name, teacher_id, schedule, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.lessons (id, module_id, class_id, date, topic, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: message_queue; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.message_queue (id, type, payload, status, attempts, last_error, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: message_templates; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.message_templates (id, name, content, variables, parent_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.modules (id, class_id, title, lessons_count, total_tasks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: os_reports; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.os_reports (id, module_id, student_id, generated_at, report_html, report_pdf_url, status, sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: parent_links; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.parent_links (id, student_id, link_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.parents (id, name, email, phone, parent_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.students (id, name, dob, avatar, parent_id, external_project_link, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: algotrack
--

COPY public.teachers (id, name, email, phone, password, avatar, status, created_at, updated_at) FROM stdin;
cmielcuak000123bot9zslr6f	Александр	alexander@algoschool.org	+79991234567	$2b$10$UVLtJpwFdOrOPou1gbR4R.Lg7sTVsrUGdIn3o09hsEL0kc2BF4qz2	\N	active	2025-11-25 13:08:09.692	2025-11-25 13:08:09.692
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: class_students class_students_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT class_students_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: message_queue message_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.message_queue
    ADD CONSTRAINT message_queue_pkey PRIMARY KEY (id);


--
-- Name: message_templates message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: os_reports os_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.os_reports
    ADD CONSTRAINT os_reports_pkey PRIMARY KEY (id);


--
-- Name: parent_links parent_links_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.parent_links
    ADD CONSTRAINT parent_links_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: admins_email_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_actor_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs USING btree (actor_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: cards_created_at_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX cards_created_at_idx ON public.cards USING btree (created_at);


--
-- Name: cards_created_by_teacher_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX cards_created_by_teacher_id_idx ON public.cards USING btree (created_by_teacher_id);


--
-- Name: cards_lesson_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX cards_lesson_id_idx ON public.cards USING btree (lesson_id);


--
-- Name: cards_student_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX cards_student_id_idx ON public.cards USING btree (student_id);


--
-- Name: class_students_class_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX class_students_class_id_idx ON public.class_students USING btree (class_id);


--
-- Name: class_students_class_id_student_id_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX class_students_class_id_student_id_key ON public.class_students USING btree (class_id, student_id);


--
-- Name: class_students_student_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX class_students_student_id_idx ON public.class_students USING btree (student_id);


--
-- Name: classes_teacher_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX classes_teacher_id_idx ON public.classes USING btree (teacher_id);


--
-- Name: lessons_class_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX lessons_class_id_idx ON public.lessons USING btree (class_id);


--
-- Name: lessons_date_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX lessons_date_idx ON public.lessons USING btree (date);


--
-- Name: lessons_module_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX lessons_module_id_idx ON public.lessons USING btree (module_id);


--
-- Name: message_queue_created_at_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX message_queue_created_at_idx ON public.message_queue USING btree (created_at);


--
-- Name: message_queue_status_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX message_queue_status_idx ON public.message_queue USING btree (status);


--
-- Name: message_queue_type_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX message_queue_type_idx ON public.message_queue USING btree (type);


--
-- Name: modules_class_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX modules_class_id_idx ON public.modules USING btree (class_id);


--
-- Name: os_reports_module_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX os_reports_module_id_idx ON public.os_reports USING btree (module_id);


--
-- Name: os_reports_module_id_student_id_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX os_reports_module_id_student_id_key ON public.os_reports USING btree (module_id, student_id);


--
-- Name: os_reports_status_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX os_reports_status_idx ON public.os_reports USING btree (status);


--
-- Name: os_reports_student_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX os_reports_student_id_idx ON public.os_reports USING btree (student_id);


--
-- Name: parent_links_link_token_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX parent_links_link_token_idx ON public.parent_links USING btree (link_token);


--
-- Name: parent_links_link_token_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX parent_links_link_token_key ON public.parent_links USING btree (link_token);


--
-- Name: parent_links_student_id_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX parent_links_student_id_key ON public.parent_links USING btree (student_id);


--
-- Name: parents_email_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX parents_email_key ON public.parents USING btree (email);


--
-- Name: students_parent_id_idx; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE INDEX students_parent_id_idx ON public.students USING btree (parent_id);


--
-- Name: teachers_email_key; Type: INDEX; Schema: public; Owner: algotrack
--

CREATE UNIQUE INDEX teachers_email_key ON public.teachers USING btree (email);


--
-- Name: cards cards_created_by_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_created_by_teacher_id_fkey FOREIGN KEY (created_by_teacher_id) REFERENCES public.teachers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cards cards_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cards cards_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: class_students class_students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT class_students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: class_students class_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT class_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lessons lessons_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modules modules_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: os_reports os_reports_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.os_reports
    ADD CONSTRAINT os_reports_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: os_reports os_reports_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.os_reports
    ADD CONSTRAINT os_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parent_links parent_links_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.parent_links
    ADD CONSTRAINT parent_links_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: students students_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: algotrack
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict pEpF0Bqk8fjHJGUzMsxDnBmoaIgxd8vzbNft1MOCiRymHUD45hvpIaOOqws2H12

