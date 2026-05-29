CREATE DATABASE so_auth;
CREATE DATABASE so_devices;
CREATE DATABASE so_notifications;
GRANT ALL PRIVILEGES ON DATABASE so_auth TO souser;
GRANT ALL PRIVILEGES ON DATABASE so_devices TO souser;
GRANT ALL PRIVILEGES ON DATABASE so_notifications TO souser;

\c so_auth
--
-- PostgreSQL database dump
--

\restrict qfSPKISOwDX30uFE73g3dQ03Tim6gbnqFgGHak9O282gh9WWmUHEViJoRpXe0aA

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key9;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key8;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key7;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key6;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key5;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key4;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key3;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key2;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key14;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key13;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key12;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key11;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key10;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key1;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TYPE IF EXISTS public.enum_roles_name;
--
-- Name: enum_roles_name; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_roles_name AS ENUM (
    'admin',
    'manager',
    'staff',
    'guest'
);


ALTER TYPE public.enum_roles_name OWNER TO souser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO souser;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO souser;

--
-- Name: users; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id uuid,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    assigned_room character varying(255),
    assigned_floor integer
);


ALTER TABLE public.users OWNER TO souser;

--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, revoked, "createdAt", "updatedAt") FROM stdin;
3c8dacdf-2e74-471a-a4aa-9f3c26b0c229	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$dxqG7JEm9ej1wmXdBCyT7OwlBTlRsdXvzt5/x9V/r6oJ.Lcp3s2Sm	2026-06-01 13:00:29.268+00	t	2026-05-25 13:00:29.269+00	2026-05-25 13:15:31.327+00
06d81ded-15ce-4154-96e3-149db7f47ac9	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$KCfbQg071rk3UtjNwiziwu4gtEy210OOkLUqd3d0CHKty9PcVdM8i	2026-06-01 13:31:40.479+00	t	2026-05-25 13:31:40.48+00	2026-05-25 13:46:44.341+00
d173c304-4a6b-46fe-a8b0-15fb1bc25934	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$MjccZKm/HRfMag0ctxQjSO.VhgPmrvkHdDPWjIFmfhweY6X7KQ4vK	2026-06-01 14:01:48.405+00	t	2026-05-25 14:01:48.407+00	2026-05-25 14:16:55.466+00
30635218-464f-4cc3-998d-b251552e0d28	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$tKJmdAd.c0MJtOeKjIOL5eVKTB1WCk7DAK59judkN8EfBv.yYMRVm	2026-06-01 14:31:58.63+00	t	2026-05-25 14:31:58.632+00	2026-05-25 14:47:01.777+00
2f8fcada-1b55-45fe-8198-5c72a1a7c107	1212ec73-7732-4f8c-b271-a439e27aab25	$2a$08$FGuUakf5FXpoCvQVbF4TS.aBlop./aF9C.saPhgd4QqiJ/iDZqDhq	2026-06-05 13:05:00.684+00	f	2026-05-29 13:05:00.684+00	2026-05-29 13:05:00.684+00
3e6bc0bf-287d-4a07-98db-81f208031fbc	1212ec73-7732-4f8c-b271-a439e27aab25	$2a$08$DJaLzMVnklzneFwPncIYluSmlujTkWKZ2n63UlRdib8jB3pEBqcGW	2026-06-05 13:08:42.197+00	f	2026-05-29 13:08:42.197+00	2026-05-29 13:08:42.197+00
22a66ac0-d73c-490f-a9ae-da6d8652ee11	1212ec73-7732-4f8c-b271-a439e27aab25	$2a$08$yag7bzXhIqNLktc6hCh7MONg/NhTlO7C7yNS9PDJ8X6xtF/ywXIvi	2026-06-05 13:13:13.412+00	f	2026-05-29 13:13:13.412+00	2026-05-29 13:13:13.412+00
e0351098-669d-4c3f-aaa5-2a26f4060591	b61e4a31-1377-4813-86fc-fb8f81d572f1	$2a$08$z46qGiHsXgeWtbgrwXoYxONGIb9qB5bs9cLbiTAOf0KCsNcblebbq	2026-06-05 13:13:57.131+00	f	2026-05-29 13:13:57.131+00	2026-05-29 13:13:57.131+00
2156dd91-29bf-479f-acac-a1ae8f94bbd7	1212ec73-7732-4f8c-b271-a439e27aab25	$2a$08$0CFjjHgViXKCBJlvIcFEaukL4Bi90UtOB0DariyhvhpFmNB1dWrJm	2026-06-05 13:15:15.438+00	f	2026-05-29 13:15:15.44+00	2026-05-29 13:15:15.44+00
b7cfdf19-76d7-41b2-ad06-27b4b385f8ac	1212ec73-7732-4f8c-b271-a439e27aab25	$2a$08$EUJn.4iuyBi0THqkNuiV4eOEn8y6sqiEfsA89EWNzZMRjH..DdV42	2026-06-05 13:15:46.77+00	f	2026-05-29 13:15:46.77+00	2026-05-29 13:15:46.77+00
cded7f76-a6c1-4735-a839-ef07dd97f76d	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$7IddvWL/H3Dbjj0oVDssDuON68rEXlZ5wYdvd.8ndm7rVEqYA0jWi	2026-06-05 13:18:29.792+00	f	2026-05-29 13:18:29.793+00	2026-05-29 13:18:29.793+00
7dca96dc-6219-41c3-a975-3a9ce1766212	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$UE4iFSwWxk/4xeXyG3dxXO6YkH46XlFJ9TgQ/0JQXyqeKhafzuZpq	2026-06-05 12:47:19.133+00	t	2026-05-29 12:47:19.135+00	2026-05-29 13:33:33.353+00
17920d5d-6a9c-4c54-bc71-138fa810d75a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$gZ5PVJFhd2/TKTw2/FfDKukoXwP8c.dISNdyON57uDK7ZSIJpcqtW	2026-06-05 12:57:09.697+00	t	2026-05-29 12:57:09.698+00	2026-05-29 13:48:53.349+00
99d9a60e-540d-4e33-bde8-cf5f312c1be3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	$2a$08$IXTAAEfamPSxBH/NQphJuuatg1MskPdeomdnPOKF36HCA3NjxCxFy	2026-06-05 13:15:38.203+00	t	2026-05-29 13:15:38.204+00	2026-05-29 14:03:53.344+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.roles (id, name, permissions, description, "createdAt", "updatedAt") FROM stdin;
9ea735bc-3620-4f04-9661-ee0e3224c396	admin	{"users": ["read", "write", "delete"], "devices": ["read", "write", "delete", "control"], "automation": ["read", "write", "delete"]}	\N	2026-05-25 12:59:22.083+00	2026-05-25 12:59:22.083+00
28a6fd17-1a9b-4e32-8be5-a8e8a1b856cd	manager	{"devices": ["read", "write", "control"], "automation": ["read", "write"]}	\N	2026-05-25 12:59:22.098+00	2026-05-25 12:59:22.098+00
35709b03-48b4-4684-a544-c6445b8fe42d	staff	{"devices": ["read", "control"], "automation": ["read"]}	\N	2026-05-25 12:59:22.111+00	2026-05-25 12:59:22.111+00
d33fa3a9-b6f2-459c-9640-15377d167862	guest	{"devices": ["read"]}	\N	2026-05-25 12:59:22.119+00	2026-05-25 12:59:22.119+00
a1765547-df59-4557-8523-b6967513d16c	director	{"devices": ["read", "write", "control"], "automation": ["read", "write"]}	\N	2026-05-29 14:11:08.129+00	2026-05-29 14:11:08.129+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.users (id, name, email, password_hash, role_id, is_active, last_login, "createdAt", "updatedAt", assigned_room, assigned_floor) FROM stdin;
99e56099-19af-4bf3-9da3-754a0dc78fd0	Office Staff (Room 101)	staff101@smartoffice.vn	$2a$12$gimvVP6VryQ1p7ozzwqze.X.hXsEP/uE8Le2KpVQxWNM4anwrOukG	35709b03-48b4-4684-a544-c6445b8fe42d	t	\N	2026-05-29 13:02:57.693+00	2026-05-29 13:02:57.693+00	room101	\N
b61e4a31-1377-4813-86fc-fb8f81d572f1	Guest User	guest@smartoffice.vn	$2a$12$gimvVP6VryQ1p7ozzwqze.X.hXsEP/uE8Le2KpVQxWNM4anwrOukG	d33fa3a9-b6f2-459c-9640-15377d167862	t	2026-05-29 13:13:57.137+00	2026-05-29 13:02:57.701+00	2026-05-29 13:13:57.137+00	\N	\N
1212ec73-7732-4f8c-b271-a439e27aab25	Office Staff (Room 301)	staff@smartoffice.vn	$2a$12$gimvVP6VryQ1p7ozzwqze.X.hXsEP/uE8Le2KpVQxWNM4anwrOukG	35709b03-48b4-4684-a544-c6445b8fe42d	t	2026-05-29 13:15:46.779+00	2026-05-29 13:02:57.686+00	2026-05-29 13:15:46.779+00	room301	\N
2cafeaf4-933c-4847-9096-fbc85bbaddb6	System Admin	admin@smartoffice.vn	$2a$12$cBfATb.BbOWJpOSH4owhgOYIhlB2ODpPDVCMRcfOk/Js3uUNVj1oi	9ea735bc-3620-4f04-9661-ee0e3224c396	t	2026-05-29 13:18:29.815+00	2026-05-25 12:59:22.479+00	2026-05-29 13:18:29.816+00	\N	\N
e737d914-4253-4f0e-b9b2-e53b93220a84	Floor 1 Director	director@smartoffice.vn	$2a$12$2J8C/aTnP/hdeAfagcb2Ze.Isd7oHWd2Ghjp5K4Iv.RTokRRteEWS	a1765547-df59-4557-8523-b6967513d16c	t	\N	2026-05-29 14:11:08.536+00	2026-05-29 14:11:08.536+00	\N	1
8ed3170a-2b4d-4927-a6e2-5f958a8394b8	Office Manager	manager@smartoffice.vn	$2a$12$gimvVP6VryQ1p7ozzwqze.X.hXsEP/uE8Le2KpVQxWNM4anwrOukG	28a6fd17-1a9b-4e32-8be5-a8e8a1b856cd	t	\N	2026-05-29 13:02:57.666+00	2026-05-29 14:11:08.568+00	Marketing	\N
\.


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qfSPKISOwDX30uFE73g3dQ03Tim6gbnqFgGHak9O282gh9WWmUHEViJoRpXe0aA



\c so_devices
--
-- PostgreSQL database dump
--

\restrict zs9tmtLGji4BKPKscyOsGRieAXpnhlAgsU0QGEf2jm9Xoj9CgL00SawDYy55tgl

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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

ALTER TABLE IF EXISTS ONLY public.devices DROP CONSTRAINT IF EXISTS devices_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exec_logs DROP CONSTRAINT IF EXISTS exec_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.devices DROP CONSTRAINT IF EXISTS devices_pkey;
ALTER TABLE IF EXISTS ONLY public.device_groups DROP CONSTRAINT IF EXISTS device_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.command_logs DROP CONSTRAINT IF EXISTS command_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.automation_rules DROP CONSTRAINT IF EXISTS automation_rules_pkey;
DROP TABLE IF EXISTS public.exec_logs;
DROP TABLE IF EXISTS public.devices;
DROP TABLE IF EXISTS public.device_groups;
DROP TABLE IF EXISTS public.command_logs;
DROP TABLE IF EXISTS public.automation_rules;
DROP TYPE IF EXISTS public.enum_exec_logs_result;
DROP TYPE IF EXISTS public.enum_devices_type;
DROP TYPE IF EXISTS public.enum_automation_rules_trigger_type;
--
-- Name: enum_automation_rules_trigger_type; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_automation_rules_trigger_type AS ENUM (
    'sensor',
    'schedule',
    'manual'
);


ALTER TYPE public.enum_automation_rules_trigger_type OWNER TO souser;

--
-- Name: enum_devices_type; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_devices_type AS ENUM (
    'light',
    'ac',
    'camera',
    'door',
    'sensor',
    'projector',
    'printer',
    'tv',
    'router'
);


ALTER TYPE public.enum_devices_type OWNER TO souser;

--
-- Name: enum_exec_logs_result; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_exec_logs_result AS ENUM (
    'success',
    'failed',
    'skipped'
);


ALTER TYPE public.enum_exec_logs_result OWNER TO souser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.automation_rules (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trigger_type public.enum_automation_rules_trigger_type DEFAULT 'sensor'::public.enum_automation_rules_trigger_type,
    condition jsonb DEFAULT '{}'::jsonb,
    action jsonb DEFAULT '{}'::jsonb,
    notify boolean DEFAULT true,
    notify_message character varying(255),
    is_active boolean DEFAULT true,
    last_triggered timestamp with time zone,
    trigger_count integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.automation_rules OWNER TO souser;

--
-- Name: command_logs; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.command_logs (
    id uuid NOT NULL,
    device_id uuid,
    user_id uuid,
    command character varying(255),
    payload jsonb,
    source character varying(255) DEFAULT 'user'::character varying,
    result character varying(255) DEFAULT 'success'::character varying,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.command_logs OWNER TO souser;

--
-- Name: device_groups; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.device_groups (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    floor integer,
    zone character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.device_groups OWNER TO souser;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.devices (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.enum_devices_type NOT NULL,
    room character varying(255),
    floor integer DEFAULT 1,
    status boolean DEFAULT false,
    ip_address character varying(255),
    mqtt_topic character varying(255),
    settings jsonb DEFAULT '{}'::jsonb,
    last_seen timestamp with time zone,
    group_id uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.devices OWNER TO souser;

--
-- Name: exec_logs; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.exec_logs (
    id uuid NOT NULL,
    rule_id uuid,
    trigger_data jsonb,
    result public.enum_exec_logs_result DEFAULT 'success'::public.enum_exec_logs_result,
    error_msg text,
    duration_ms integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.exec_logs OWNER TO souser;

--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.automation_rules (id, name, description, trigger_type, condition, action, notify, notify_message, is_active, last_triggered, trigger_count, "createdAt", "updatedAt") FROM stdin;
fc6ab4bc-8543-4b68-8fbf-d991aad09a45	Tắt đèn khi không có người	\N	sensor	{"operator": "==", "threshold": 0, "sensor_type": "motion"}	{"command": "OFF", "device_id": "placeholder-light-id"}	f	\N	f	\N	0	2026-05-25 12:59:22.448+00	2026-05-29 12:50:15.008+00
406868fd-d313-41cd-9158-c7ab539f09fc	Bat dieu hoa		sensor	{"operator": ">", "threshold": 40, "sensor_type": "temperature"}	{"params": {"target_temp": 24}, "command": "ON", "device_id": "e59def4f-2830-4039-a1b3-442418670d3a"}	t		f	2026-05-25 13:52:41.752+00	1	2026-05-25 13:52:32.073+00	2026-05-29 13:06:21.587+00
499b5a5a-9c14-4065-9afd-80e0ecf5adb2	Bật điều hòa khi nhiệt độ > 29°C	Kịch bản Câu 3 đề thi IT03A-2511	sensor	{"operator": ">", "threshold": 29, "sensor_type": "temperature"}	{"params": {"target_temp": 24}, "command": "ON", "device_id": "b264f649-8377-45ff-9e32-0e300e333446"}	t	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	f	2026-05-25 13:42:18.378+00	3	2026-05-25 12:59:22.426+00	2026-05-29 13:59:20.523+00
\.


--
-- Data for Name: command_logs; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.command_logs (id, device_id, user_id, command, payload, source, result, "createdAt", "updatedAt") FROM stdin;
8cc66894-f49d-4cb9-a736-b4b846115dd5	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:00:37.335+00	2026-05-25 13:00:37.335+00
2cd0b43c-0dfa-4efb-a514-e81e110b7dad	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:00:41.342+00	2026-05-25 13:00:41.342+00
994a4f9f-295d-4d5d-b296-7acaaf83e700	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:00:42.316+00	2026-05-25 13:00:42.316+00
44f2ad44-d265-47b8-a9fc-2f00a6fc627f	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:04:32.241+00	2026-05-25 13:04:32.241+00
12fc2e32-8a56-4ddd-bd91-58206605c87b	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:08:48.226+00	2026-05-25 13:08:48.226+00
50122d83-57e6-4c4c-aad4-89307c782751	d50cf10f-f9e1-42e7-8dd7-f0d953443c20	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:08:54.97+00	2026-05-25 13:08:54.97+00
d0924aca-3b03-4936-bd8f-edfd54a1213d	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:09:00.626+00	2026-05-25 13:09:00.626+00
0401c27c-9c4f-4789-9cdf-962743740bb5	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:09:08.107+00	2026-05-25 13:09:08.107+00
53215126-b877-4609-a68d-18fcfd12d3ba	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:09:15.167+00	2026-05-25 13:09:15.167+00
4700b6c9-b286-40d0-b724-b60b2f7e77f4	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:09:16.195+00	2026-05-25 13:09:16.195+00
35afb012-ac8f-47c6-b556-1e68e284a232	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:09:16.983+00	2026-05-25 13:09:16.983+00
398de370-ca7b-4b57-a274-7487d8ba2010	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:09:22.36+00	2026-05-25 13:09:22.36+00
093eb86d-9b03-420f-a6bb-5f8674bf9648	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:09:25.869+00	2026-05-25 13:09:25.869+00
a2174b46-a40c-49b4-b1c8-9045351a76f5	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:09:26.576+00	2026-05-25 13:09:26.576+00
595de49a-edfd-4288-b9a0-05f760ad0736	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:09:34.272+00	2026-05-25 13:09:34.272+00
e1b24f3a-3541-47ef-a5f0-aee963caf3e4	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:14:34.249+00	2026-05-25 13:14:34.249+00
a97aaabb-f1ec-454d-b6ff-119632938457	d50cf10f-f9e1-42e7-8dd7-f0d953443c20	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:19:00.744+00	2026-05-25 13:19:00.744+00
7255be39-0f90-4779-8bd4-930a5e175e99	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:19:03.245+00	2026-05-25 13:19:03.245+00
160bb220-91a3-4d9e-936b-951640fdb2bf	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:19:04.122+00	2026-05-25 13:19:04.122+00
61552246-5a1c-42c5-9bb7-6cbb7ec46cf2	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:19:04.888+00	2026-05-25 13:19:04.888+00
a79bfdb3-7d3a-4b98-aa59-7838d6ef53ac	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:19:05.529+00	2026-05-25 13:19:05.529+00
5bde0aa5-a6fb-4ea9-bfea-7c8fab3f84eb	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:19:06.195+00	2026-05-25 13:19:06.195+00
88f1c0c4-c24a-465a-a605-a6817a98c3f0	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:22:25.747+00	2026-05-25 13:22:25.747+00
69d817aa-859e-4eb5-8765-c2bf59f7b9ae	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:22:31.777+00	2026-05-25 13:22:31.777+00
1990044c-2c31-47ea-ae67-c487a3c6b4bc	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:22:36.59+00	2026-05-25 13:22:36.59+00
f30f3738-d270-4b44-9170-edb3272a0468	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:22:38.98+00	2026-05-25 13:22:38.98+00
e0a31519-e2b5-4152-9911-617f065b875c	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:22:39.494+00	2026-05-25 13:22:39.494+00
2c973f83-8004-4da0-bdfb-d9774df1ef58	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:22:40.736+00	2026-05-25 13:22:40.736+00
a34ef524-9047-414f-8cfc-dc7767067235	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:22:41.586+00	2026-05-25 13:22:41.586+00
08537399-a338-43c7-ba0c-0845e920b965	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:23:14.388+00	2026-05-25 13:23:14.388+00
59e9aafd-f2a9-4a31-8afe-92d4f10a45b8	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:23:15.522+00	2026-05-25 13:23:15.522+00
0fd4815b-df79-4b07-a31f-696701e0ad8e	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:23:16.797+00	2026-05-25 13:23:16.797+00
a5de083d-b417-4042-b0a7-f94b99cb5106	f74ca988-7867-4d57-ab2a-2b77279bd712	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:23:17.961+00	2026-05-25 13:23:17.961+00
e71953ac-22c2-44c7-bfac-bdda93d00d7f	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:23:18.483+00	2026-05-25 13:23:18.483+00
1a254dc5-34b6-4c2c-b4ed-56e38d3e664b	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:23:21.489+00	2026-05-25 13:23:21.489+00
b6fa3e35-f5c9-4db6-a452-2ca8c032fef2	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:23:24.51+00	2026-05-25 13:23:24.51+00
b20e8b72-ae91-4826-8b93-959f053495d3	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:23:40.028+00	2026-05-25 13:23:40.028+00
3e7fe6ce-5f53-439b-86f8-a4927d21233f	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:02.864+00	2026-05-25 13:25:02.864+00
4e6443a8-b07c-45d2-9fe6-f541e8298082	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:25:03.466+00	2026-05-25 13:25:03.466+00
43360175-ac9c-488f-aa2a-36a7e29db4ea	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:03.994+00	2026-05-25 13:25:03.994+00
2559c10a-945f-420d-baba-0b59b0ba567f	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:25:04.343+00	2026-05-25 13:25:04.343+00
02a2f796-e0cc-4920-8e52-fdb88abb55f6	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:04.572+00	2026-05-25 13:25:04.572+00
4eb00816-4927-4061-925f-c52e055c914a	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:25:04.781+00	2026-05-25 13:25:04.781+00
bf9f782d-772e-43b9-b262-65d09586cf69	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:04.967+00	2026-05-25 13:25:04.967+00
b7b9710b-55cd-4eca-a6ca-32f9db33397d	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:05.163+00	2026-05-25 13:25:05.163+00
ad151f34-3653-4a29-b85f-b043ceb755f7	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:25:06.519+00	2026-05-25 13:25:06.519+00
5357071b-b3fc-4282-9b7a-4988f1cac71c	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:07.02+00	2026-05-25 13:25:07.02+00
8779d541-60c8-4aa8-92c3-3b0efc0b1a0d	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:25:07.465+00	2026-05-25 13:25:07.465+00
94b6433f-7793-4f25-91b3-1d85b452b20f	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:25:07.667+00	2026-05-25 13:25:07.667+00
42464ac7-8a95-4c91-a6c4-67f1534e9964	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:06.869+00	2026-05-25 13:26:06.869+00
e63e92aa-0b04-475a-9736-9f3e3af2e9c8	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:08.918+00	2026-05-25 13:26:08.918+00
86bcb339-78e3-4325-9480-382d94593af9	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:10.369+00	2026-05-25 13:26:10.369+00
9cf193bb-bea2-4c37-8b9d-b2c3ebcf114b	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:12.266+00	2026-05-25 13:26:12.266+00
a1f07853-6598-48e7-8a14-37b176825f68	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:13.35+00	2026-05-25 13:26:13.35+00
7a83706e-0033-464b-805f-4173e4ba82dc	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:14.389+00	2026-05-25 13:26:14.389+00
e6669dd1-a756-4f5a-b295-dfb690423d09	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:15.403+00	2026-05-25 13:26:15.403+00
3e0884b0-1e76-410a-87dd-21723727d6ef	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:16.139+00	2026-05-25 13:26:16.139+00
78d9537a-94fc-478d-a35c-82c1de36c174	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:17.159+00	2026-05-25 13:26:17.159+00
6a169a84-a422-4ae0-935c-ecb20b6b0277	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:17.956+00	2026-05-25 13:26:17.956+00
c11a0cef-cb2e-418b-92a1-853e57a3e036	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:26:23.059+00	2026-05-25 13:26:23.059+00
aaaab61f-5c4d-42f3-9b3b-2b5876fa33b3	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:26:23.886+00	2026-05-25 13:26:23.886+00
2e887d0b-0ed4-40a4-8919-8f1ac701915b	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:28:39.54+00	2026-05-25 13:28:39.54+00
656b37df-c3d6-4661-8f60-afc3630f3d87	4bb8bfa2-3cab-4f64-a695-e4eefa2b4b4c	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:28:44.542+00	2026-05-25 13:28:44.542+00
9f1d0bbf-3ac3-41cb-b6ed-85684a11aabd	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:28:45.925+00	2026-05-25 13:28:45.925+00
5725763f-1254-4785-ab5f-23cac1791c3b	4bb8bfa2-3cab-4f64-a695-e4eefa2b4b4c	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:28:47.508+00	2026-05-25 13:28:47.508+00
38846dc2-cbd4-4cd2-bc1c-3941476e89f0	4bb8bfa2-3cab-4f64-a695-e4eefa2b4b4c	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:28:48.321+00	2026-05-25 13:28:48.321+00
12f4b9c3-b588-4e1f-9b47-b854fb58e905	e59def4f-2830-4039-a1b3-442418670d3a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:28:54.663+00	2026-05-25 13:28:54.663+00
e1deac13-8c81-40c4-82a8-8af9886abf31	f74ca988-7867-4d57-ab2a-2b77279bd712	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:29:54.311+00	2026-05-25 13:29:54.311+00
d9d199fe-6641-42ee-9e4f-b3678b1ba4fa	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:30:16.201+00	2026-05-25 13:30:16.201+00
245e0030-203c-419e-9a77-fd974e45a23f	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:30:17.576+00	2026-05-25 13:30:17.576+00
4af8274d-cebf-42a2-a019-227812ce4eae	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 13:30:18.299+00	2026-05-25 13:30:18.299+00
6346e403-b3df-466a-a802-18a24db61f3c	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:42:15.301+00	2026-05-25 13:42:15.301+00
8a40375f-361c-41f9-9238-631a12fde39b	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:50:29.185+00	2026-05-25 13:50:29.185+00
c8b144f1-be08-4688-ad66-f99a4e233a06	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 13:50:52.061+00	2026-05-25 13:50:52.061+00
d624fa49-b65c-4c7c-b2ec-fcba912030b7	e59def4f-2830-4039-a1b3-442418670d3a	\N	ON	{"target_temp": 24}	automation	success	2026-05-25 13:52:38.883+00	2026-05-25 13:52:38.883+00
10c4f368-9c25-4881-830e-fbc2a0dbd1d2	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:17:33.314+00	2026-05-25 14:17:33.314+00
e5ae8872-03d3-4184-88f5-732207c3daf5	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:17:34.465+00	2026-05-25 14:17:34.465+00
f275a2d5-4395-48f4-bc10-1c17ba57f975	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:19:43.356+00	2026-05-25 14:19:43.356+00
54e2fd0a-786c-4654-9b95-1cd3e1c50341	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:20:15.158+00	2026-05-25 14:20:15.158+00
9094779a-ecc4-433c-84df-5905e5ed3281	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:24:09.61+00	2026-05-25 14:24:09.61+00
08e6e6af-fe99-4f12-b8f6-782390298876	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:29:12.637+00	2026-05-25 14:29:12.637+00
10203cdc-5272-465c-b571-4ce7e054886e	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:29:32.215+00	2026-05-25 14:29:32.215+00
ec32cbc7-3764-4495-afe9-a2a066723210	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:29:46.134+00	2026-05-25 14:29:46.134+00
059ed94d-136f-47e0-89f5-9f1f72ec8b79	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:29:48.68+00	2026-05-25 14:29:48.68+00
615843f8-d8cd-4a6c-81d3-4472621c6f5f	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:34:33.076+00	2026-05-25 14:34:33.076+00
14d7cede-8fee-4daa-9d8a-f60256d3a43e	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:34:33.978+00	2026-05-25 14:34:33.978+00
2b7e1bdd-9bd4-4b1c-bca8-778aac8d6350	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:34:34.885+00	2026-05-25 14:34:34.885+00
3765a43e-448c-49d1-9739-015525ab300d	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:34:36.042+00	2026-05-25 14:34:36.042+00
a01fbb6d-2dc2-4d52-944b-b1f5cf544eca	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:34:47.65+00	2026-05-25 14:34:47.65+00
20b3cecd-a1ef-4766-9ea4-ca0b87fe20fd	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:34:49.619+00	2026-05-25 14:34:49.619+00
f3ea99a3-b82f-4be1-be29-7db19c89595a	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:34:50.674+00	2026-05-25 14:34:50.674+00
f390ac84-b545-4f3d-9667-42c6ae918c33	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:34:52.369+00	2026-05-25 14:34:52.369+00
4fd318d5-0d73-45c3-aadf-b6206f59f754	d50cf10f-f9e1-42e7-8dd7-f0d953443c20	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:05.179+00	2026-05-25 14:35:05.179+00
fa62f165-a281-42bb-9e6d-ebda38f26286	f74ca988-7867-4d57-ab2a-2b77279bd712	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:06.013+00	2026-05-25 14:35:06.013+00
0da40614-6a6a-45a9-8b24-33c1b872bbff	4bb8bfa2-3cab-4f64-a695-e4eefa2b4b4c	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:06.752+00	2026-05-25 14:35:06.752+00
b1c33850-a39c-41c0-96d9-61020b1fd6af	bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:07.297+00	2026-05-25 14:35:07.297+00
a58beb26-2bac-483f-9a3d-912f8b689b5a	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:08.086+00	2026-05-25 14:35:08.086+00
ca93fe7d-bc10-4fff-97be-ed2013bce877	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:35:08.67+00	2026-05-25 14:35:08.67+00
12b49d6e-e40e-4599-a18a-77615ae54f33	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:37:59.953+00	2026-05-25 14:37:59.953+00
239706fe-1c50-4cd9-9160-adcd2794fa3b	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:38:01.086+00	2026-05-25 14:38:01.086+00
fb23a711-e797-4efa-8f86-fc8ca7ab8629	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:38:01.579+00	2026-05-25 14:38:01.579+00
2971eec1-5ec8-4de6-a78b-53ef3734ee6e	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:38:02.306+00	2026-05-25 14:38:02.306+00
e54a8ffc-d864-438f-9aab-c2bf857016fe	5dfd063e-f654-4b38-b3b0-a15f8d0c176e	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:39:15.503+00	2026-05-25 14:39:15.503+00
df4e98f4-96ec-45cf-907b-100241898550	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-25 14:46:10.115+00	2026-05-25 14:46:10.115+00
2918fc80-2b42-4c69-ab9d-ba4fb71d22b8	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-25 14:46:13.027+00	2026-05-25 14:46:13.027+00
7a8e0608-b2e5-4fb5-9462-ee1a205d5d72	ecdae270-4cd6-4cba-8bec-6471e876a619	1212ec73-7732-4f8c-b271-a439e27aab25	ON	{}	user	success	2026-05-29 13:05:33.779+00	2026-05-29 13:05:33.779+00
3a8ad27b-3741-4c32-b279-d971257e760d	43910a81-0f4f-494b-a337-38ca28e58e70	1212ec73-7732-4f8c-b271-a439e27aab25	ON	{}	user	success	2026-05-29 13:05:34.289+00	2026-05-29 13:05:34.289+00
c5813e0d-b8b1-4702-941d-5a355b83af32	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 13:35:22.893+00	2026-05-29 13:35:22.893+00
cc201ce4-264f-4a0c-bae3-194e6b06e413	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 13:35:24.476+00	2026-05-29 13:35:24.476+00
3eff3c8f-dba0-4285-8e40-b3e71ad6f627	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 13:40:53.74+00	2026-05-29 13:40:53.74+00
30482ad6-1316-4fdc-85a8-f3674f73ff38	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 13:40:54.797+00	2026-05-29 13:40:54.797+00
7b6d0e01-6797-4f8d-9cf1-d7a6684cfb16	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 13:52:54.141+00	2026-05-29 13:52:54.141+00
b86c3db7-3b72-47b1-957a-5c08dc839086	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 13:52:55.143+00	2026-05-29 13:52:55.143+00
87be3e09-372d-4f0c-93cb-acb4cdd8494e	0f4850be-5259-4c8a-a547-fcf9e00b1b5a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:00:56.54+00	2026-05-29 14:00:56.54+00
da785585-aceb-420f-96e9-2d2382a96c6f	0f4850be-5259-4c8a-a547-fcf9e00b1b5a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:00:57.93+00	2026-05-29 14:00:57.93+00
ebaa09c5-d63e-48a2-a6fd-695c8188d16b	0f4850be-5259-4c8a-a547-fcf9e00b1b5a	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:01:14.494+00	2026-05-29 14:01:14.494+00
58b24a9e-c2a0-43be-b5d5-460761fb166a	e9c8a4cd-2b49-4364-b92b-8137db200e27	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:01:51.692+00	2026-05-29 14:01:51.692+00
4b423b5f-6fa4-4d70-9e37-589457d847fc	adc94516-5b2f-4697-bdc2-45dbe714730b	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:01:52.531+00	2026-05-29 14:01:52.531+00
5909cb5b-97b5-4f86-beaf-2355baf496a7	cdc5dba4-50a4-411c-a4f6-9aa6839bd720	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:01:53.705+00	2026-05-29 14:01:53.705+00
d1ea4d57-8089-40b7-ad52-005cdf04d964	54562b50-1c4f-4f0d-b760-c7bc4c0985cf	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:01:54.738+00	2026-05-29 14:01:54.738+00
8ed1dfa6-cee8-444c-9297-f7c1f8f0c56f	cdc5dba4-50a4-411c-a4f6-9aa6839bd720	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:40.949+00	2026-05-29 14:08:40.949+00
e5a3e3f4-496a-4406-b358-244fc34e8d83	54562b50-1c4f-4f0d-b760-c7bc4c0985cf	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:40.99+00	2026-05-29 14:08:40.99+00
7352ef9e-b292-4f47-85c3-161c2eb5984d	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.022+00	2026-05-29 14:08:41.022+00
b4d36cc0-028c-4aa8-8e1e-6924e0b2a158	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.064+00	2026-05-29 14:08:41.064+00
4c0f375d-8628-473b-99fa-8ed82d63b8bd	e9c8a4cd-2b49-4364-b92b-8137db200e27	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.102+00	2026-05-29 14:08:41.102+00
0a4452d2-0ce3-474d-ab20-1eaac70715f9	adc94516-5b2f-4697-bdc2-45dbe714730b	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.14+00	2026-05-29 14:08:41.14+00
d6fa9727-b5e9-4cd6-84a9-e601943a87fd	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.173+00	2026-05-29 14:08:41.173+00
e87ae907-06af-4ef2-9191-7b6d11da409e	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:08:41.204+00	2026-05-29 14:08:41.204+00
be7b504b-f07a-476f-a5b5-dafe8ad95c7a	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:10:13.869+00	2026-05-29 14:10:13.869+00
64b3bb1b-259d-43d0-b241-73ede0c1c5ad	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:10:13.906+00	2026-05-29 14:10:13.906+00
f1de6f16-4a32-4e60-8a1e-fe95f3ac36fe	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:10:13.945+00	2026-05-29 14:10:13.945+00
53f4ee8e-dc5c-4e00-b2f5-5510e67072c8	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:10:13.979+00	2026-05-29 14:10:13.979+00
8c15046a-67ba-4113-9a58-9782de5f7029	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:10:37.982+00	2026-05-29 14:10:37.982+00
b1b9e512-233a-415d-8f33-b76a0b2017fd	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:10:39.246+00	2026-05-29 14:10:39.246+00
7eeef3c1-68ef-4318-b249-748cf292531e	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:10:40.115+00	2026-05-29 14:10:40.115+00
02662ae3-1eda-4612-aa84-cda0cf75eb31	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:11:24.259+00	2026-05-29 14:11:24.259+00
59379aac-33b1-4753-9c3a-1752600afc83	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:11:31.317+00	2026-05-29 14:11:31.317+00
448870ad-fe26-4d7d-9456-87e80786f8bd	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:11:33.136+00	2026-05-29 14:11:33.136+00
8cd9f089-6dcf-4c1d-9132-1452e8fb4716	54562b50-1c4f-4f0d-b760-c7bc4c0985cf	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:11:50.311+00	2026-05-29 14:11:50.311+00
71762dd0-1e21-42b9-ad18-e87c191fa8fc	c711b3ac-fa35-4228-8494-5542f02589b4	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:36.027+00	2026-05-29 14:13:36.027+00
bd035714-eef3-4461-b89a-33f6c89efb64	c711b3ac-fa35-4228-8494-5542f02589b4	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:13:37.575+00	2026-05-29 14:13:37.575+00
30dbab04-8ac6-46e8-a9e6-1ac6d294c6ca	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:47.969+00	2026-05-29 14:13:47.969+00
b10cb564-e5a1-4b95-bdfa-81d5c8e24090	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:47.993+00	2026-05-29 14:13:47.993+00
dbc9fe72-e2d4-4737-a0a8-5807e06067e8	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:48.021+00	2026-05-29 14:13:48.021+00
c8206ad3-335e-4e94-b8e0-aaf22d68b8f9	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:48.058+00	2026-05-29 14:13:48.058+00
42af24cb-9bd4-4634-8e16-62438bcefb53	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:13:48.094+00	2026-05-29 14:13:48.094+00
2604566e-9aea-440b-bbc8-a8a91f8ed4af	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:15.253+00	2026-05-29 14:14:15.253+00
252b2cca-9a43-4592-91d8-224e252157f5	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:15.287+00	2026-05-29 14:14:15.287+00
046d4f81-3b57-48f9-b629-7917ad6531a6	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:15.314+00	2026-05-29 14:14:15.314+00
d7ad0105-4b38-433f-870b-e99cfa6da9fd	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:15.345+00	2026-05-29 14:14:15.345+00
f376a9cc-c475-4374-b3d2-b03fd1faf47d	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:15.378+00	2026-05-29 14:14:15.378+00
cfcdc928-fc69-4606-8ac2-743e3dc74302	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:28+00	2026-05-29 14:14:28+00
eca06588-a63c-447c-abed-271ba885db83	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:28.03+00	2026-05-29 14:14:28.03+00
361f10d6-5e2a-4678-8c2f-416fa394e431	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:28.079+00	2026-05-29 14:14:28.079+00
24292559-6a13-4b9a-ae22-2169eb3a7f64	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:28.146+00	2026-05-29 14:14:28.146+00
f7ccc775-f86f-4b59-a4c5-c14ca7871619	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:28.216+00	2026-05-29 14:14:28.216+00
d2b77b6c-446f-469b-b630-051975fcf720	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:48.727+00	2026-05-29 14:14:48.727+00
f87a60c2-5880-427b-8f10-20294a4d2169	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:49.364+00	2026-05-29 14:14:49.364+00
208c21fe-4bcf-4917-a92f-084dc879ceaa	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:49.653+00	2026-05-29 14:14:49.653+00
43a9c0ab-f785-422b-8c57-9746576ba80f	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:50.423+00	2026-05-29 14:14:50.423+00
bb5383cb-7163-42e6-a47d-2a9546c12de5	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:51.003+00	2026-05-29 14:14:51.003+00
8ab3b6ec-20cd-4356-9b71-aed38fa20f73	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:51.065+00	2026-05-29 14:14:51.065+00
0084242b-065d-4a6e-9c2c-843a8d7c4cb5	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:51.784+00	2026-05-29 14:14:51.784+00
d8b45f7e-df94-4f9e-b7d9-5e45fe110476	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:52.641+00	2026-05-29 14:14:52.641+00
a51f4d14-b244-4a38-9356-e8a8cc749e72	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:53.242+00	2026-05-29 14:14:53.242+00
64613e73-3bea-4c85-a7b0-653832e266f3	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:53.811+00	2026-05-29 14:14:53.811+00
240c45b2-6591-4d3c-8119-e6eae58cba56	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:54.265+00	2026-05-29 14:14:54.265+00
5126d9d4-4da8-4696-bc66-c83a052cc99f	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:54.306+00	2026-05-29 14:14:54.306+00
f01631a7-99b2-4849-8b11-2daa621412db	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:54.35+00	2026-05-29 14:14:54.35+00
b5e2f1a8-656e-45bc-aab2-f91ec61abdf5	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:54.375+00	2026-05-29 14:14:54.375+00
78ba4686-5384-406f-9bbb-94db611455e4	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:14:54.697+00	2026-05-29 14:14:54.697+00
95d658ee-cbb6-4f7a-8f44-0af038216a25	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:14:56.035+00	2026-05-29 14:14:56.035+00
b88301d7-3cd4-4ddc-a624-a87e30e31528	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.369+00	2026-05-29 14:15:12.369+00
3fcfbe0c-b7d1-443d-b5c7-b1ad31d754f9	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.388+00	2026-05-29 14:15:12.388+00
d4e9875b-d58c-4351-8864-d8151b308e0f	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.492+00	2026-05-29 14:15:12.492+00
fd953c13-f20f-4d92-8afe-7619220aedc5	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.561+00	2026-05-29 14:15:12.561+00
7d85475a-c1ef-4e35-b202-16cedee7ccd1	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.83+00	2026-05-29 14:15:12.83+00
e2fdcdc5-ee41-41de-835d-3934bb169ad5	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.831+00	2026-05-29 14:15:12.831+00
57253c5e-52a0-4e0e-a225-9340e77c3aca	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.881+00	2026-05-29 14:15:12.881+00
5910ea38-2460-4161-81eb-987b170921d0	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.909+00	2026-05-29 14:15:12.909+00
01cb0b58-ac14-4d0a-834d-325961b96081	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:12.93+00	2026-05-29 14:15:12.93+00
e579ada2-b839-43f1-afe9-4132f077a158	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:15:22.058+00	2026-05-29 14:15:22.058+00
dcda0966-9a6f-45de-9e25-2ac40c39a345	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:15:22.092+00	2026-05-29 14:15:22.092+00
ee72851f-463c-4d07-b1e2-5e568e76fa47	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:15:22.123+00	2026-05-29 14:15:22.123+00
4f0f5c2c-611c-40bc-a55a-413d869854c8	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:15:22.15+00	2026-05-29 14:15:22.15+00
b4deb5a7-a147-4657-8c41-130acbb75721	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	ON	{}	user	success	2026-05-29 14:15:22.175+00	2026-05-29 14:15:22.175+00
eb914f11-cf6c-497e-ac00-686a5eeccae6	cc4660f6-08a1-40a8-8d0f-22312ef67227	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:30.412+00	2026-05-29 14:15:30.412+00
da6a4b23-e061-4aa2-88dc-eb477c37528b	75b26e71-fbb6-4245-b8bd-6d21c5b04d72	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:30.44+00	2026-05-29 14:15:30.44+00
9775791f-d141-404b-a1a9-cfdeb23313af	b264f649-8377-45ff-9e32-0e300e333446	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:30.483+00	2026-05-29 14:15:30.483+00
590511c7-2299-46c7-b3ac-1efed16e2d5f	ecdae270-4cd6-4cba-8bec-6471e876a619	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:30.515+00	2026-05-29 14:15:30.515+00
f503ed13-e5f7-4f64-aed5-a10deb6a1939	43910a81-0f4f-494b-a337-38ca28e58e70	2cafeaf4-933c-4847-9096-fbc85bbaddb6	OFF	{}	user	success	2026-05-29 14:15:30.552+00	2026-05-29 14:15:30.552+00
\.


--
-- Data for Name: device_groups; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.device_groups (id, name, floor, zone, "createdAt", "updatedAt") FROM stdin;
2b2f80ae-9c51-432b-bd15-5abd3361b598	Tầng 3	3	office	2026-05-25 12:59:21.72+00	2026-05-25 12:59:21.72+00
80511ad0-e175-45b5-a99a-2d4f502d0e48	Sảnh	1	entrance	2026-05-25 12:59:21.735+00	2026-05-25 12:59:21.735+00
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.devices (id, name, type, room, floor, status, ip_address, mqtt_topic, settings, last_seen, group_id, "createdAt", "updatedAt") FROM stdin;
cc4660f6-08a1-40a8-8d0f-22312ef67227	Den	light	Phòng họp	1	f		office/1/none/light/cmd	{"x": 8.088235294117645, "y": 50}	2026-05-29 14:15:30.4+00	\N	2026-05-29 14:12:51.128+00	2026-05-29 14:15:30.402+00
75b26e71-fbb6-4245-b8bd-6d21c5b04d72	Cửa chính	door	Phòng họp	1	f		office/1/none/door/cmd	{"x": 23.294117647058826, "y": 51.08823529411765}	2026-05-29 14:15:30.436+00	\N	2026-05-29 13:52:17.788+00	2026-05-29 14:15:30.436+00
b264f649-8377-45ff-9e32-0e300e333446	Điều hòa	ac	Phòng họp	1	f		office/1/none/ac/cmd	{"x": 6.823529411764703, "y": 3.9705882352941226}	2026-05-29 14:15:30.476+00	\N	2026-05-29 13:52:30.297+00	2026-05-29 14:15:30.476+00
ecdae270-4cd6-4cba-8bec-6471e876a619	CUA SO	door	Phòng nhân sự	1	f		office/1/301/door/cmd	{"x": 6.06811145510836, "y": 82.83436532507741}	2026-05-29 14:15:30.509+00	\N	2026-05-25 14:34:28.154+00	2026-05-29 14:15:30.509+00
43910a81-0f4f-494b-a337-38ca28e58e70	Cửa chính	door	Phòng nhân sự	1	f	\N	office/1/entrance/door/cmd	{"x": 36.656346749225996, "y": 82.24613003095979}	2026-05-29 14:15:30.548+00	80511ad0-e175-45b5-a99a-2d4f502d0e48	2026-05-25 12:59:21.789+00	2026-05-29 14:15:30.548+00
cdc5dba4-50a4-411c-a4f6-9aa6839bd720	Router	router	Phòng họp	1	f		office/1/none/router/cmd	{"x": 43.382352941176464, "y": 3.9705882352941195}	2026-05-29 14:08:40.936+00	\N	2026-05-29 13:59:53.13+00	2026-05-29 14:08:40.937+00
4bb8bfa2-3cab-4f64-a695-e4eefa2b4b4c	Cảm biến nhiệt 301	sensor	none	3	t	\N	office/3/room301/temperature	{"x": 77.47058823529412, "y": 32.23529411764706}	2026-05-25 14:35:06.749+00	2b2f80ae-9c51-432b-bd15-5abd3361b598	2026-05-25 12:59:21.796+00	2026-05-29 13:35:31.417+00
d50cf10f-f9e1-42e7-8dd7-f0d953443c20	Đèn phòng 301	light	none	3	t	\N	office/3/room301/light/cmd	{"x": 21.588235294117652, "y": 28.705882352941178}	2026-05-25 14:35:05.173+00	2b2f80ae-9c51-432b-bd15-5abd3361b598	2026-05-25 12:59:21.742+00	2026-05-29 13:35:31.435+00
e59def4f-2830-4039-a1b3-442418670d3a	Điều hòa 301	ac	none	3	t	\N	office/3/room301/ac/cmd	{"target_temp": 24}	2026-05-25 13:52:38.877+00	2b2f80ae-9c51-432b-bd15-5abd3361b598	2026-05-25 12:59:21.761+00	2026-05-29 13:35:31.455+00
f74ca988-7867-4d57-ab2a-2b77279bd712	Đèn phòng 302	light	none	3	t	\N	office/3/room302/light/cmd	{}	2026-05-25 14:35:06.006+00	2b2f80ae-9c51-432b-bd15-5abd3361b598	2026-05-25 12:59:21.751+00	2026-05-29 13:35:31.473+00
bbdcfdfb-9bf6-4234-86c8-3368f4d410f3	Điều hòa 302	ac	none	3	t	\N	office/3/room302/ac/cmd	{"target_temp": 24}	2026-05-25 14:35:07.291+00	2b2f80ae-9c51-432b-bd15-5abd3361b598	2026-05-25 12:59:21.772+00	2026-05-29 13:35:31.49+00
5dfd063e-f654-4b38-b3b0-a15f8d0c176e	Camera sảnh	camera	Phòng họp	1	t	http://192.168.1.5:8080/video	office/1/lobby/camera/cmd	{"x": 43.73529411764706, "y": 51.38235294117647, "ai_triggers": {"no_person": ["light", "ac"], "person_detected": ["light", "door", "ac"], "cooldown_seconds": 120}}	2026-05-25 14:39:15.494+00	80511ad0-e175-45b5-a99a-2d4f502d0e48	2026-05-25 12:59:21.782+00	2026-05-29 14:13:23.357+00
e9c8a4cd-2b49-4364-b92b-8137db200e27	Máy chiếu	projector	Phòng họp	1	f		office/1/none/projector/cmd	{"x": 42.294117647058826, "y": 31.911764705882355}	2026-05-29 14:08:41.095+00	\N	2026-05-29 14:01:34.059+00	2026-05-29 14:08:41.096+00
adc94516-5b2f-4697-bdc2-45dbe714730b	máy in	printer	Phòng họp	1	f		office/1/none/printer/cmd	{"x": 43.23529411764706, "y": 19.852941176470587}	2026-05-29 14:08:41.134+00	\N	2026-05-29 14:01:09.797+00	2026-05-29 14:08:41.135+00
c711b3ac-fa35-4228-8494-5542f02589b4	TV	tv	Phòng họp	1	f		office/1/none/tv/cmd	{"x": 6.9117647058823515, "y": 28.676470588235293}	2026-05-29 14:13:37.565+00	\N	2026-05-29 14:12:44.599+00	2026-05-29 14:13:37.565+00
\.


--
-- Data for Name: exec_logs; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.exec_logs (id, rule_id, trigger_data, result, error_msg, duration_ms, "createdAt", "updatedAt") FROM stdin;
b3e87599-4475-4375-9fe7-e0951c25dff1	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	failed	Request failed with status code 500	27	2026-05-25 12:59:28.183+00	2026-05-25 12:59:28.183+00
ed47f5b6-26b8-4515-9616-342bd4a61f0b	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	failed	Request failed with status code 500	10	2026-05-25 12:59:31.096+00	2026-05-25 12:59:31.096+00
ed99162f-9943-42ed-96ef-36071e9ae930	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	failed	Request failed with status code 500	12	2026-05-25 12:59:34.099+00	2026-05-25 12:59:34.099+00
e6604d3a-72b5-4d5e-9f42-21ba04b5eef4	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	success	\N	3225	2026-05-25 13:23:18.729+00	2026-05-25 13:23:18.729+00
ad1291ae-d3fe-42cc-9d1a-6c8ac2c9566a	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	success	\N	2673	2026-05-25 13:23:21.145+00	2026-05-25 13:23:21.145+00
9eab214e-9d83-44ba-bdc7-b4a9903183ff	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	success	\N	3162	2026-05-25 13:23:24.64+00	2026-05-25 13:23:24.64+00
cf2e49d6-ff13-4a33-927f-36ced56ee2e8	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	success	\N	2486	2026-05-25 13:23:26.978+00	2026-05-25 13:23:26.978+00
e67c852e-ee1e-41e0-8733-34a102d1b72c	499b5a5a-9c14-4065-9afd-80e0ecf5adb2	{"manual": true, "triggered_by": "2cafeaf4-933c-4847-9096-fbc85bbaddb6"}	success	\N	3085	2026-05-25 13:42:18.357+00	2026-05-25 13:42:18.357+00
c6b64d5c-ea84-449e-853a-bf96e9a5a47c	406868fd-d313-41cd-9158-c7ab539f09fc	{"manual": true, "triggered_by": "2cafeaf4-933c-4847-9096-fbc85bbaddb6"}	success	\N	2878	2026-05-25 13:52:41.747+00	2026-05-25 13:52:41.747+00
\.


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: command_logs command_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_pkey PRIMARY KEY (id);


--
-- Name: device_groups device_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.device_groups
    ADD CONSTRAINT device_groups_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: exec_logs exec_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.exec_logs
    ADD CONSTRAINT exec_logs_pkey PRIMARY KEY (id);


--
-- Name: devices devices_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.device_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zs9tmtLGji4BKPKscyOsGRieAXpnhlAgsU0QGEf2jm9Xoj9CgL00SawDYy55tgl



\c so_notifications
--
-- PostgreSQL database dump
--

\restrict pgDu8kQiE4CMBqLJhFg1uOVzpOyjEy8ywNxZSLdnsLcTD6Lbwpve7QeIGqSex8m

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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

ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.notifications;
DROP TYPE IF EXISTS public.enum_notifications_status;
DROP TYPE IF EXISTS public.enum_notifications_channel;
--
-- Name: enum_notifications_channel; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_notifications_channel AS ENUM (
    'push',
    'email',
    'sms',
    'in_app'
);


ALTER TYPE public.enum_notifications_channel OWNER TO souser;

--
-- Name: enum_notifications_status; Type: TYPE; Schema: public; Owner: souser
--

CREATE TYPE public.enum_notifications_status AS ENUM (
    'pending',
    'delivered',
    'failed'
);


ALTER TYPE public.enum_notifications_status OWNER TO souser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    message text NOT NULL,
    channel public.enum_notifications_channel DEFAULT 'in_app'::public.enum_notifications_channel,
    status public.enum_notifications_status DEFAULT 'delivered'::public.enum_notifications_status,
    context jsonb DEFAULT '{}'::jsonb,
    read_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO souser;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: souser
--

CREATE TABLE public.system_settings (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO souser;

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.notifications (id, type, message, channel, status, context, read_at, "createdAt", "updatedAt") FROM stdin;
6b59f4f7-c2e3-4284-ad2b-9dc1a9dcbdf4	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 12:59:28.154+00	2026-05-25 13:37:17.947+00
073e76e4-48c5-4ae5-a6b8-e8c630c05ece	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 12:59:31.083+00	2026-05-25 13:37:17.947+00
acc77f36-40f2-41a2-9382-5d9700d6fecf	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 12:59:34.085+00	2026-05-25 13:37:17.947+00
c0f92c61-b755-4fe2-adb7-97ee1e5c0564	sensor_alert	Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:15.478+00	2026-05-25 13:37:17.947+00
aa4e32a5-f88b-4799-9a6c-9aa4d3fcd374	automation_alert	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "service": "monitoring-service", "device_id": "sensor-temp-301", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:15.555+00	2026-05-25 13:37:17.947+00
d139ba42-f432-48c3-af4b-1050bed4550d	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:18.469+00	2026-05-25 13:37:17.947+00
73bcc6d1-b9d0-4c72-984c-7c3c40582ca8	automation_alert	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "service": "monitoring-service", "device_id": "sensor-temp-301", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:18.494+00	2026-05-25 13:37:17.947+00
08eac746-0455-4815-af7e-3ed29eda3109	automation	Kịch bản "Bật điều hòa khi nhiệt độ > 29°C" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:23:18.740Z", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:18.745+00	2026-05-25 13:37:17.947+00
be4f7c14-f205-42de-80bb-d989b6af11e5	automation	Kịch bản "Bật điều hòa khi nhiệt độ > 29°C" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:23:21.156Z", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:21.159+00	2026-05-25 13:37:17.947+00
8097a9d5-9142-4f1e-976b-ca236465518c	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:21.475+00	2026-05-25 13:37:17.947+00
e9241d7b-d3c4-4a6d-b43b-92b9f272cde2	automation_alert	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "service": "monitoring-service", "device_id": "sensor-temp-301", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:21.5+00	2026-05-25 13:37:17.947+00
c7483e3a-71c4-4703-800e-53711665de1b	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:24.487+00	2026-05-25 13:37:17.947+00
25e2a724-2cd8-43ef-b6fe-59297f6019df	automation_alert	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "service": "monitoring-service", "device_id": "sensor-temp-301", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C", "threshold": 29, "sensor_type": "temperature"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:24.531+00	2026-05-25 13:37:17.947+00
6686b5c5-5180-4e83-bfca-3527c5dcc32d	automation	Kịch bản "Bật điều hòa khi nhiệt độ > 29°C" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:23:24.652Z", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:24.655+00	2026-05-25 13:37:17.947+00
647247f9-1905-4320-a20c-5bf290625f7b	automation	Kịch bản "Bật điều hòa khi nhiệt độ > 29°C" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:23:26.996Z", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C"}	2026-05-25 13:37:17.946+00	2026-05-25 13:23:27.001+00	2026-05-25 13:37:17.947+00
78b0a08d-24e6-4b9b-bb75-f30cb9546fcf	automation	Kịch bản "Bat dieu hoa" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:52:41.756Z", "rule_id": "406868fd-d313-41cd-9158-c7ab539f09fc", "rule_name": "Bat dieu hoa"}	2026-05-25 13:53:05.555+00	2026-05-25 13:52:41.769+00	2026-05-25 13:53:05.556+00
6ebac0f7-3efd-48ed-9527-1cb3e41fd1a0	automation	Kịch bản "Bật điều hòa khi nhiệt độ > 29°C" đã kích hoạt thành công	in_app	delivered	{"ts": "2026-05-25T13:42:18.389Z", "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C"}	2026-05-25 13:53:06.498+00	2026-05-25 13:42:18.398+00	2026-05-25 13:53:06.498+00
a4fb6c6c-72f0-4f48-9e89-5af375e2280c	automation_alert	Kịch bản "Bat dieu hoa" đã thực thi.	in_app	delivered	{"manual": true, "rule_id": "406868fd-d313-41cd-9158-c7ab539f09fc", "rule_name": "Bat dieu hoa", "triggered_by": "2cafeaf4-933c-4847-9096-fbc85bbaddb6"}	2026-05-25 13:53:07.005+00	2026-05-25 13:52:38.904+00	2026-05-25 13:53:07.005+00
7a718aa3-17bb-4b9e-808d-81dd937188e1	automation_alert	⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.	in_app	delivered	{"manual": true, "rule_id": "499b5a5a-9c14-4065-9afd-80e0ecf5adb2", "rule_name": "Bật điều hòa khi nhiệt độ > 29°C", "triggered_by": "2cafeaf4-933c-4847-9096-fbc85bbaddb6"}	2026-05-25 13:53:07.425+00	2026-05-25 13:42:15.318+00	2026-05-25 13:53:07.425+00
9c3b1f57-3bce-457b-add9-1d810a11864b	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 12:52:13.613+00	2026-05-29 12:47:05.66+00	2026-05-29 12:52:13.614+00
7cd550c3-02fb-4c86-bd88-ede0ad218318	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 12:52:13.613+00	2026-05-29 12:47:08.653+00	2026-05-29 12:52:13.614+00
e3568ef5-0d7b-4ba8-bd45-466ef80113cd	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 12:52:13.613+00	2026-05-29 12:47:11.654+00	2026-05-29 12:52:13.614+00
5bcca00c-9f32-4b4a-be73-c9d9cbba1da7	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:46.212+00	2026-05-29 13:03:50.607+00	2026-05-29 13:07:46.212+00
ac20cff9-849a-4097-a753-713d9ae438e2	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:46.703+00	2026-05-29 13:03:08.925+00	2026-05-29 13:07:46.704+00
0db9e44c-69dc-44ef-a576-6bfd3d2a3b39	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:47.367+00	2026-05-29 13:03:47.606+00	2026-05-29 13:07:47.367+00
abb0fa1c-f9b6-446a-8d1f-7efa0d8fdc39	sensor_alert	Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:47.656+00	2026-05-29 13:03:44.597+00	2026-05-29 13:07:47.656+00
65357ce2-a38f-4e00-9010-a0459a89ff9d	sensor_alert	Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:05.217+00	2026-05-29 13:07:50.841+00
ac144519-df6b-4b93-9887-390fc4e4c350	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:08.22+00	2026-05-29 13:07:50.841+00
ba9e8a12-f6cb-4033-a459-e1db8e13b7f1	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:41.29+00	2026-05-29 13:07:08.487+00	2026-05-29 13:07:41.291+00
3c9e980e-8240-44b5-bb51-7bc4787a4261	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:41.871+00	2026-05-29 13:07:05.47+00	2026-05-29 13:07:41.871+00
26c824a5-40a0-4ba9-a044-e8bc4ffbf20b	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:42.195+00	2026-05-29 13:07:02.478+00	2026-05-29 13:07:42.195+00
3b88d474-a7b0-4bb0-96b0-a659edbe731b	sensor_alert	Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:42.615+00	2026-05-29 13:06:59.473+00	2026-05-29 13:07:42.616+00
a69511a4-3825-4c9c-afc4-881d1f9d4371	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:43.019+00	2026-05-29 13:04:34.099+00	2026-05-29 13:07:43.019+00
91e3f42f-ad23-4914-aeb7-eb320c7aa6dd	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:43.649+00	2026-05-29 13:04:31.095+00	2026-05-29 13:07:43.649+00
dc337b4e-e9b3-4ed6-8d8b-9ee2271ca685	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:44.699+00	2026-05-29 13:04:28.095+00	2026-05-29 13:07:44.699+00
5701b622-d6b9-4f41-95ec-d128d96ac0a7	sensor_alert	Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.2, "message": "Cảnh báo: temperature=29.2celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:44.953+00	2026-05-29 13:04:25.098+00	2026-05-29 13:07:44.953+00
249531d3-d9c8-4e1f-939c-c918cc5c43a5	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:45.338+00	2026-05-29 13:03:53.611+00	2026-05-29 13:07:45.338+00
61b40b87-58b3-4c9e-a5fe-fb3275a3bf08	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:43.508+00	2026-05-29 13:07:50.841+00
a938434e-1f47-42c4-be0c-524db84041e7	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:46.671+00	2026-05-29 13:07:50.841+00
7b1d3b05-8a6c-42ea-b68e-203ef3e82eb2	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:49.676+00	2026-05-29 13:07:50.841+00
8f171ba1-318c-4e01-be9c-00f8ef241177	sensor_alert	Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.5, "message": "Cảnh báo: temperature=29.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:00:52.685+00	2026-05-29 13:07:50.841+00
140ab9d9-052e-44f4-85de-afb0c2c0b27e	sensor_alert	Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 29.8, "message": "Cảnh báo: temperature=29.8celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:03:03.253+00	2026-05-29 13:07:50.841+00
ded4f7ea-eb82-4dd6-8cea-7bc20c76fb3d	sensor_alert	Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301	in_app	delivered	{"room": "room301", "unit": "celsius", "floor": "3", "value": 30.5, "message": "Cảnh báo: temperature=30.5celsius vượt ngưỡng 29.0°C tại room301", "service": "monitoring-service", "device_id": "sensor-temp-301", "threshold": 29, "sensor_type": "temperature"}	2026-05-29 13:07:50.84+00	2026-05-29 13:03:05.919+00	2026-05-29 13:07:50.841+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: souser
--

COPY public.system_settings (key, value, "createdAt", "updatedAt") FROM stdin;
NOTIFY_EMAIL	maitruong1312205@gmail.com	2026-05-25 13:39:49.426+00	2026-05-25 13:41:57.851+00
FLOOR_PLAN_CONFIG	{"width":1000,"height":1000,"rooms":[{"id":"1780061195691","name":"Phòng nhân sự","left":4.476780185758505,"top":63.566563467492266,"width":46.13003095975232,"height":34.82972136222911,"floor":1,"color":"#ebe2ba","shape":"L","rotation":0},{"id":"1780062701525","name":"Phòng họp","left":3.9473684210526314,"top":1.2105263157894717,"width":42.8421052631579,"height":53.68421052631579,"floor":1,"color":"#cc7f58"}],"floors":{"1":{"width":1000,"height":1000,"shape":"square"},"2":{"width":1000,"height":1000,"shape":"U"}}}	2026-05-29 13:26:35.786+00	2026-05-29 14:07:10.009+00
\.


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: souser
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- PostgreSQL database dump complete
--

\unrestrict pgDu8kQiE4CMBqLJhFg1uOVzpOyjEy8ywNxZSLdnsLcTD6Lbwpve7QeIGqSex8m

