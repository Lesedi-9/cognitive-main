SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict pd4TLP8MQ7oep7KMJkSTA4gM82v8tPba9SGbfaD0gUe4FBflyldpBAG54uR7DSj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	6792ea36-afa7-4987-acd8-f6974bed3ff5	authenticated	authenticated	lesedimagakwe@richfield.ac.zaa	$2a$10$dZ8GLJaUjtpT0aHKx5gEiuK.8YzFUcEp6czbN946119xNPFmQ3lPi	2026-10-22 12:59:13.569379+00	\N		\N		\N			\N	2026-10-22 13:00:38.463685+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-10-22 12:59:13.554344+00	2026-10-22 13:00:38.479842+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	06856eaf-7042-4adf-ba42-1b9977071735	authenticated	authenticated	maxwheelfx@gmail.com	$2a$10$bLxBDCdItuZAUVgY2dcQYefHbFBp7z4nsE/6gqjw3lYtw3wc8hk2u	2026-10-22 12:30:31.408538+00	\N		2026-10-22 12:28:37.957109+00		\N			\N	2026-10-24 20:44:06.399571+00	{"provider": "email", "providers": ["email"]}	{"sub": "06856eaf-7042-4adf-ba42-1b9977071735", "name": "System Administrator", "email": "maxwheelfx@gmail.com", "department": "Academic Administration & Research", "institution": "Higher Education Academy", "email_verified": true, "phone_verified": false}	\N	2026-10-22 12:28:37.915382+00	2026-10-25 16:40:49.348035+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	authenticated	authenticated	lesedimagakwe9@gmail.com	$2a$10$1FSkcjRrgXctvV5s4U0EWuEUVuGhDoNQHo/VyOq2O5S/VM1K38MTy	2026-10-23 11:25:28.258368+00	\N		\N		\N			\N	2026-10-24 22:16:08.356461+00	{"provider": "email", "providers": ["email"]}	{"sub": "bfbb1948-73c2-40da-9bd5-1cbc80aa8b37", "name": "Lesedi Magakwe", "email": "lesedimagakwe9@gmail.com", "department": "Cognitive Science & Computer Science", "student_id": "402311859", "institution": "Richfield", "email_verified": true, "phone_verified": false}	\N	2026-10-23 11:25:28.222508+00	2026-10-25 20:16:03.136567+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
06856eaf-7042-4adf-ba42-1b9977071735	06856eaf-7042-4adf-ba42-1b9977071735	{"sub": "06856eaf-7042-4adf-ba42-1b9977071735", "name": "System Administrator", "email": "maxwheelfx@gmail.com", "department": "Academic Administration & Research", "institution": "Higher Education Academy", "email_verified": true, "phone_verified": false}	email	2026-10-22 12:28:37.946359+00	2026-10-22 12:28:37.946422+00	2026-10-22 12:28:37.946422+00	92bd1f4b-eacd-48aa-9a72-06163bdd4ed7
6792ea36-afa7-4987-acd8-f6974bed3ff5	6792ea36-afa7-4987-acd8-f6974bed3ff5	{"sub": "6792ea36-afa7-4987-acd8-f6974bed3ff5", "email": "lesedimagakwe@richfield.ac.zaa", "email_verified": false, "phone_verified": false}	email	2026-10-22 12:59:13.565453+00	2026-10-22 12:59:13.565513+00	2026-10-22 12:59:13.565513+00	295612c5-3978-4807-a803-e938f6e6f4ee
bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	{"sub": "bfbb1948-73c2-40da-9bd5-1cbc80aa8b37", "name": "Lesedi Magakwe", "email": "lesedimagakwe9@gmail.com", "department": "Cognitive Science & Computer Science", "student_id": "402311859", "institution": "Richfield", "email_verified": false, "phone_verified": false}	email	2026-10-23 11:25:28.248956+00	2026-10-23 11:25:28.24901+00	2026-10-23 11:25:28.24901+00	52a744f9-9105-4fe2-be7e-588cc85fea87
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
8a486af9-5f3e-4e26-94ec-7bf8840c89de	6792ea36-afa7-4987-acd8-f6974bed3ff5	2026-10-22 13:00:38.464479+00	2026-10-22 13:00:38.464479+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	154.73.182.149	\N	\N	\N	\N	\N
bdcc4644-a0e4-42db-bddd-639b85e3b996	06856eaf-7042-4adf-ba42-1b9977071735	2026-10-24 20:44:06.400802+00	2026-10-25 16:40:49.369204+00	\N	aal1	\N	2026-10-25 16:40:49.369089	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0	102.38.103.237	\N	\N	\N	\N	\N
00ced2e5-a41b-4745-8c19-6d24d36973b5	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	2026-10-24 22:16:08.357384+00	2026-10-25 20:16:03.159359+00	\N	aal1	\N	2026-10-25 20:16:03.159195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0	102.38.105.236	\N	\N	\N	\N	\N
108e0985-5753-4173-a025-01e374cf8cac	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	2026-10-23 21:55:30.752533+00	2026-10-23 21:55:30.752533+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0	102.38.105.236	\N	\N	\N	\N	\N
e5b73035-c933-46af-aa3d-2baf69caef74	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	2026-10-23 22:56:00.803327+00	2026-10-24 21:50:33.609491+00	\N	aal1	\N	2026-10-24 21:50:33.609341	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0	102.38.105.236	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
8a486af9-5f3e-4e26-94ec-7bf8840c89de	2026-10-22 13:00:38.480596+00	2026-10-22 13:00:38.480596+00	password	f1502164-5e0e-467e-bb5b-b66a94c4f579
108e0985-5753-4173-a025-01e374cf8cac	2026-10-23 21:55:30.761462+00	2026-10-23 21:55:30.761462+00	password	8a8e682d-f978-42cb-a275-52ac760bd7d5
e5b73035-c933-46af-aa3d-2baf69caef74	2026-10-23 22:56:00.864455+00	2026-10-23 22:56:00.864455+00	password	235d5c03-4569-468d-b0ef-9baa128ed509
bdcc4644-a0e4-42db-bddd-639b85e3b996	2026-10-24 20:44:06.497593+00	2026-10-24 20:44:06.497593+00	password	fe6b176b-0814-427a-8575-830ddfb1d193
00ced2e5-a41b-4745-8c19-6d24d36973b5	2026-10-24 22:16:08.389686+00	2026-10-24 22:16:08.389686+00	password	e79a560d-3c0a-454c-8649-7ed846c0e29f
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_recovery_code_sets" ("id", "user_id", "mfa_factor_id", "failed_verification_count", "verification_locked_until", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_recovery_codes" ("id", "mfa_recovery_code_set_id", "code_hash", "consumed_at", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	7	wm57c3res2ra	6792ea36-afa7-4987-acd8-f6974bed3ff5	f	2026-10-22 13:00:38.47371+00	2026-10-22 13:00:38.47371+00	\N	8a486af9-5f3e-4e26-94ec-7bf8840c89de
00000000-0000-0000-0000-000000000000	19	txhr5qfspk6k	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	f	2026-10-23 21:55:30.759589+00	2026-10-23 21:55:30.759589+00	\N	108e0985-5753-4173-a025-01e374cf8cac
00000000-0000-0000-0000-000000000000	20	cgie52hfolv7	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-23 22:56:00.836574+00	2026-10-24 01:02:53.971415+00	\N	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	21	arfzlakpgkdv	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 01:02:53.989674+00	2026-10-24 08:09:55.719477+00	cgie52hfolv7	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	22	o6sljxiboq5l	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 08:09:55.742975+00	2026-10-24 09:08:21.404786+00	arfzlakpgkdv	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	23	nq2i4iadfvpa	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 09:08:21.422668+00	2026-10-24 10:34:12.035125+00	o6sljxiboq5l	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	24	dgy6o2enehhj	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 10:34:12.054907+00	2026-10-24 11:51:48.740411+00	nq2i4iadfvpa	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	25	mzpivgrzhxtv	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 11:51:48.75466+00	2026-10-24 20:52:14.22911+00	dgy6o2enehhj	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	27	zi7io37xpkde	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 20:52:14.237242+00	2026-10-24 21:50:33.545158+00	mzpivgrzhxtv	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	28	gdlgjmsoi5yy	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	f	2026-10-24 21:50:33.564644+00	2026-10-24 21:50:33.564644+00	zi7io37xpkde	e5b73035-c933-46af-aa3d-2baf69caef74
00000000-0000-0000-0000-000000000000	29	rv2yw3qp5gt3	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 22:16:08.376068+00	2026-10-24 23:38:40.330154+00	\N	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	30	en67sp6njj37	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-24 23:38:40.351246+00	2026-10-25 13:19:10.075932+00	rv2yw3qp5gt3	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	31	3gczgtbq36an	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-25 13:19:10.109326+00	2026-10-25 14:17:15.856241+00	en67sp6njj37	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	32	sgiczyxt34t6	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-25 14:17:15.876183+00	2026-10-25 15:15:24.318494+00	3gczgtbq36an	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	33	hd3vj2cl4e6w	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-25 15:15:24.328695+00	2026-10-25 16:21:18.599233+00	sgiczyxt34t6	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	26	s2y3wcd3x27i	06856eaf-7042-4adf-ba42-1b9977071735	t	2026-10-24 20:44:06.452225+00	2026-10-25 16:40:49.337039+00	\N	bdcc4644-a0e4-42db-bddd-639b85e3b996
00000000-0000-0000-0000-000000000000	35	hoz65xk2ld3y	06856eaf-7042-4adf-ba42-1b9977071735	f	2026-10-25 16:40:49.343605+00	2026-10-25 16:40:49.343605+00	s2y3wcd3x27i	bdcc4644-a0e4-42db-bddd-639b85e3b996
00000000-0000-0000-0000-000000000000	34	a4kb6zclzope	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-25 16:21:18.622809+00	2026-10-25 17:19:26.381119+00	hd3vj2cl4e6w	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	36	dotopoxcfff4	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	t	2026-10-25 17:19:26.393305+00	2026-10-25 20:16:03.114175+00	a4kb6zclzope	00ced2e5-a41b-4745-8c19-6d24d36973b5
00000000-0000-0000-0000-000000000000	37	nhnqixssvn23	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	f	2026-10-25 20:16:03.130624+00	2026-10-25 20:16:03.130624+00	dotopoxcfff4	00ced2e5-a41b-4745-8c19-6d24d36973b5
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."scim_tokens" ("id", "sso_provider_id", "token_hash", "prefix", "created_at", "expires_at", "revoked_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."scim_users" ("id", "sso_provider_id", "user_id", "resource", "created_at", "updated_at", "deleted_at") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "name", "email", "role", "student_id", "institution", "department", "created_at", "last_login_at") FROM stdin;
6792ea36-afa7-4987-acd8-f6974bed3ff5	lesedimagakwe	lesedimagakwe@richfield.ac.zaa	student	\N	\N	\N	2026-10-22 12:59:13.552493+00	2026-10-22 12:59:48.193+00
06856eaf-7042-4adf-ba42-1b9977071735	System Administrator	maxwheelfx@gmail.com	admin	\N	Higher Education Academy	Academic Administration & Research	2026-10-22 12:28:37.913399+00	2026-10-25 16:40:50.871+00
bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	Lesedi Magakwe	lesedimagakwe9@gmail.com	student	402311859	Richfield	Cognitive Science & Computer Science	2026-10-23 11:25:28.220459+00	2026-10-25 20:16:04.076+00
\.


--
-- Data for Name: study_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."study_sessions" ("id", "user_id", "user_email", "user_name", "module_id", "module_title", "started_at", "completed_at", "status", "current_question_index", "active_difficulty", "total_dwell_time_ms", "responses", "adaptation_history", "final_metrics") FROM stdin;
ses-1792672595898-6co0	06856eaf-7042-4adf-ba42-1b9977071735	maxwheelfx@gmail.com	System Administrator	mod-cog-101	Cognitive Computing & Dynamic Scaffolding	2026-10-22 12:36:35.898+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792672648012-p37u	06856eaf-7042-4adf-ba42-1b9977071735	maxwheelfx@gmail.com	System Administrator	mod-algo-202	Algorithmic Complexity & Graph Optimization	2026-10-22 12:37:28.012+00	2026-10-22 12:38:10.575+00	completed	0	introductory	32306	[{"hintUsed": false, "isCorrect": false, "questionId": "q-algo-1", "attemptsCount": 1, "responseTimeMs": 16297, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 35, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": false, "questionId": "q-algo-2", "attemptsCount": 1, "responseTimeMs": 12842, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 38, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": false, "questionId": "q-algo-3", "attemptsCount": 1, "responseTimeMs": 3167, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 56, "selectedOptionIndex": 3}]	[]	{"predictedState": "overloaded", "engagementScore": 76, "totalHesitations": 0, "cognitiveLoadIndex": 43, "errorFrequencyRate": 1, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 10769}
ses-1792795193184-22s2	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	math-lin-02	Word Problems (Linear)	2026-10-23 22:39:53.184+00	2026-10-23 22:40:31.933+00	completed	0	advanced	36511	[{"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "q1", "attemptsCount": 1, "responseTimeMs": 36511, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 36, "selectedOptionIndex": 0}]	[]	{"predictedState": "overloaded", "engagementScore": 76, "totalHesitations": 0, "cognitiveLoadIndex": 36, "errorFrequencyRate": 1, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 36511}
ses-1792758439255-w14n	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	custom-1792758430953	OPERATING SYSTEMS 700 STUDY GUIDE	2026-10-23 12:27:19.255+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792797315733-ciag	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797310135	Cyber notes	2026-10-23 23:15:15.733+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792875608157-aspj	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792875192806	Cyber notes	2026-10-24 21:00:08.157+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792876693311-sfkc	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792876647599	Cyber notes	2026-10-24 21:18:13.311+00	\N	in_progress	0	introductory	31384	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792876647599-0", "attemptsCount": 1, "responseTimeMs": 7647, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792876647599-1", "attemptsCount": 1, "responseTimeMs": 23737, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 15, "selectedOptionIndex": 0}]	[]	\N
ses-1792795526216-bk5t	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792795514795	HCI NOTES (1)	2026-10-23 22:45:26.216+00	2026-10-23 22:45:37.597+00	completed	0	advanced	9247	[{"hintUsed": false, "isCorrect": true, "confidence": 2, "questionId": "q-1792795514794-0", "attemptsCount": 1, "responseTimeMs": 9247, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 8, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 9247}
ses-1792795112033-xs41	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	math-lin-01	Solving Linear Equations	2026-10-23 22:38:32.033+00	2026-10-23 22:39:38.249+00	completed	0	advanced	55879	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q1", "attemptsCount": 1, "responseTimeMs": 13965, "hesitationCount": 1, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 23, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": true, "questionId": "q2", "attemptsCount": 1, "responseTimeMs": 41914, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 19, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 1, "cognitiveLoadIndex": 21, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 27940}
ses-1792772383193-gsok	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	ai-module-1792772319512	HCI NOTES (1)	2026-10-23 16:19:43.193+00	2026-10-23 16:21:50.712+00	completed	0	introductory	116304	[{"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "ai-q-1792772319511-0", "attemptsCount": 1, "responseTimeMs": 18237, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 34, "selectedOptionIndex": 0}, {"hintUsed": true, "isCorrect": false, "confidence": 2, "questionId": "ai-q-1792772319511-1", "attemptsCount": 1, "responseTimeMs": 34430, "hesitationCount": 1, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 50, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": false, "confidence": 1, "questionId": "ai-q-1792772319511-2", "attemptsCount": 1, "responseTimeMs": 31124, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 47, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "ai-q-1792772319512-3", "attemptsCount": 1, "responseTimeMs": 16300, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 49, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "ai-q-1792772319512-4", "attemptsCount": 1, "responseTimeMs": 16213, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 49, "selectedOptionIndex": 3}]	[]	{"predictedState": "overloaded", "engagementScore": 76, "totalHesitations": 1, "cognitiveLoadIndex": 46, "errorFrequencyRate": 1, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 23261}
ses-1792880875465-i1rm	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877153867	Cyber notes	2026-10-24 22:27:55.465+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792945336874-n6ex	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877153867	Cyber notes	2026-10-25 16:22:16.874+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792946325449-uryr	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877254590	Cyber notes	2026-10-25 16:38:45.449+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792757068689-zd4q	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	custom-1792757057002	OPERATING SYSTEMS 700 STUDY GUIDE	2026-10-23 12:04:28.689+00	2026-10-23 12:06:33.798+00	completed	0	introductory	111521	[{"hintUsed": false, "isCorrect": false, "confidence": 3, "questionId": "gen-q-1792757057001-0", "attemptsCount": 1, "responseTimeMs": 15498, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 33, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "gen-q-1792757057002-1", "attemptsCount": 1, "responseTimeMs": 46286, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 28, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "gen-q-1792757057002-2", "attemptsCount": 1, "responseTimeMs": 9012, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 19, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "gen-q-1792757057002-4", "attemptsCount": 1, "responseTimeMs": 19260, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 39, "selectedOptionIndex": 2}, {"hintUsed": true, "isCorrect": false, "confidence": 2, "questionId": "gen-q-1792757057002-5", "attemptsCount": 1, "responseTimeMs": 21465, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 40, "selectedOptionIndex": 1}]	[]	{"predictedState": "overloaded", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 32, "errorFrequencyRate": 0.6, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 22304}
ses-1792795316849-380w	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	review-vault	Memory Vault Review	2026-10-23 22:41:56.849+00	2026-10-23 22:42:11.814+00	completed	0	advanced	12806	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q1", "attemptsCount": 1, "responseTimeMs": 12806, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 16, "selectedOptionIndex": 2}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 16, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 12806}
ses-1792792514985-52sv	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792792502196	OPERATING SYSTEMS 700 STUDY GUIDE	2026-10-23 21:55:14.985+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792792422456-0aub	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792792409202	HCI NOTES (1)	2026-10-23 21:53:42.456+00	\N	in_progress	0	introductory	30781	[{"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "q-1792792409202-0", "attemptsCount": 1, "responseTimeMs": 30781, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 37, "selectedOptionIndex": 0}]	[]	\N
ses-1792791281873-6poy	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	custom-1792758430953	OPERATING SYSTEMS 700 STUDY GUIDE	2026-10-23 21:34:41.873+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792945349937-m8lu	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877254590	Cyber notes	2026-10-25 16:22:29.937+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792794388574-2qvg	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	stem-cs-01	Computer Science: Binary Search	2026-10-23 22:26:28.574+00	2026-10-23 22:26:53.37+00	completed	0	introductory	20715	[{"hintUsed": false, "isCorrect": false, "confidence": 1, "questionId": "q1", "attemptsCount": 1, "responseTimeMs": 9228, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 32, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 2, "questionId": "q2", "attemptsCount": 1, "responseTimeMs": 11487, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 20, "selectedOptionIndex": 2}]	[]	{"predictedState": "overloaded", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 26, "errorFrequencyRate": 0.5, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 10358}
ses-1792796193859-yjhr	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796188801	Cyber notes	2026-10-23 22:56:33.859+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792796253592-me60	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796227765	Cyber notes	2026-10-23 22:57:33.592+00	\N	in_progress	0	introductory	6741	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792796227765-0", "attemptsCount": 1, "responseTimeMs": 6741, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	\N
ses-1792843272889-iia2	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797310135	Cyber notes	2026-10-24 12:01:12.889+00	2026-10-24 12:02:50.978+00	completed	0	introductory	88278	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792797310135-0", "attemptsCount": 1, "responseTimeMs": 29632, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 15, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792797310135-1", "attemptsCount": 1, "responseTimeMs": 7441, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 2}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792797310135-2", "attemptsCount": 1, "responseTimeMs": 17752, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792797310135-3", "attemptsCount": 1, "responseTimeMs": 13947, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 3}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792797310135-4", "attemptsCount": 1, "responseTimeMs": 19506, "hesitationCount": 2, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 28, "selectedOptionIndex": 2}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 2, "cognitiveLoadIndex": 13, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 17656}
ses-1792843489782-zd1n	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797253686	Cyber notes	2026-10-24 12:04:49.782+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792875616138-yl6c	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792875602254	Cyber notes	2026-10-24 21:00:16.138+00	\N	in_progress	0	introductory	32668	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792875602254-0", "attemptsCount": 1, "responseTimeMs": 32668, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 16, "selectedOptionIndex": 0}]	[]	\N
ses-1792876068643-2z6w	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792875192806	Cyber notes	2026-10-24 21:07:48.643+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792796396188-c0w8	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796227765	Cyber notes	2026-10-23 22:59:56.188+00	2026-10-23 23:00:11.625+00	completed	0	introductory	12994	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792796227765-0", "attemptsCount": 1, "responseTimeMs": 12994, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 8, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 12994}
ses-1792843502560-8eu0	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797310135	Cyber notes	2026-10-24 12:05:02.56+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792875199260-wwls	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792875192806	Cyber notes	2026-10-24 20:53:19.26+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792876126329-hvcj	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792876120855	Cyber notes	2026-10-24 21:08:46.329+00	2026-10-24 21:11:12.39+00	completed	0	introductory	84039	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792876120855-0", "attemptsCount": 1, "responseTimeMs": 26764, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 15, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "questionId": "q-1792876120855-1", "attemptsCount": 1, "responseTimeMs": 46123, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 17, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "questionId": "q-1792876120855-2", "attemptsCount": 1, "responseTimeMs": 11152, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 13, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 28013}
ses-1792876741176-yjim	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792876687774	Cyber notes	2026-10-24 21:19:01.176+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792877118281-bqpv	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877112486	Cyber notes	2026-10-24 21:25:18.281+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792877159369-ser5	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877153867	Cyber notes	2026-10-24 21:25:59.369+00	\N	in_progress	0	introductory	49813	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-0", "attemptsCount": 1, "responseTimeMs": 20003, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 14, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": false, "confidence": 2, "questionId": "q-1792877153867-1", "attemptsCount": 1, "responseTimeMs": 29810, "hesitationCount": 1, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 40, "selectedOptionIndex": 0}]	[]	\N
ses-1792877316793-2arn	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877153867	Cyber notes	2026-10-24 21:28:36.793+00	2026-10-24 21:30:20.659+00	completed	0	introductory	95588	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-0", "attemptsCount": 1, "responseTimeMs": 8605, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-1", "attemptsCount": 1, "responseTimeMs": 3880, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 2}, {"hintUsed": false, "isCorrect": true, "confidence": 2, "questionId": "q-1792877153867-2", "attemptsCount": 1, "responseTimeMs": 37642, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 16, "selectedOptionIndex": 1}, {"hintUsed": false, "isCorrect": false, "confidence": 1, "questionId": "q-1792877153867-3", "attemptsCount": 1, "responseTimeMs": 25883, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 33, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-4", "attemptsCount": 1, "responseTimeMs": 19578, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 20, "selectedOptionIndex": 0}]	[]	{"predictedState": "optimal_flow", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 17, "errorFrequencyRate": 0.2, "recommendedScaffold": "standard", "averageResponseTimeMs": 19118}
ses-1792878281774-4z26	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877254590	Cyber notes	2026-10-24 21:44:41.774+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792880312961-5g3g	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877254590	Cyber notes	2026-10-24 22:18:32.961+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792946234061-7aun	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792946234058	Cyber notes	2026-10-25 16:37:14.061+00	\N	in_progress	0	introductory	18796	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792946234058-0", "attemptsCount": 1, "responseTimeMs": 18796, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 14, "selectedOptionIndex": 1}]	[]	\N
ses-1792794630785-nyir	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	stem-math-01	Mathematics: Quadratic Equations	2026-10-23 22:30:30.785+00	2026-10-23 22:31:04.165+00	completed	0	introductory	30339	[{"hintUsed": false, "isCorrect": false, "confidence": 1, "questionId": "q1", "attemptsCount": 1, "responseTimeMs": 16357, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 32, "selectedOptionIndex": 3}, {"hintUsed": false, "isCorrect": false, "confidence": 1, "questionId": "q2", "attemptsCount": 1, "responseTimeMs": 13982, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 38, "selectedOptionIndex": 3}]	[]	{"predictedState": "overloaded", "engagementScore": 76, "totalHesitations": 0, "cognitiveLoadIndex": 35, "errorFrequencyRate": 1, "recommendedScaffold": "simplified_scaffold", "averageResponseTimeMs": 15170}
ses-1792793132370-cp60	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792793097279	HCI NOTES (1)	2026-10-23 22:05:32.37+00	2026-10-23 22:07:45.464+00	completed	0	introductory	111295	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792793097279-0", "attemptsCount": 1, "responseTimeMs": 68089, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 20, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "questionId": "q-1792793097279-1", "attemptsCount": 1, "responseTimeMs": 22932, "hesitationCount": 0, "adaptationAction": "Proceed with standard curriculum sequence.", "cognitiveLoadScore": 15, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "questionId": "q-1792793097279-2", "attemptsCount": 1, "responseTimeMs": 20274, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 14, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 16, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 37098}
ses-1792796231235-0iv4	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796227765	Cyber notes	2026-10-23 22:57:11.235+00	2026-10-23 22:57:24.012+00	completed	0	introductory	6531	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792796227765-0", "attemptsCount": 1, "responseTimeMs": 6531, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	{"predictedState": "underchallenged", "engagementScore": 88, "totalHesitations": 0, "cognitiveLoadIndex": 8, "errorFrequencyRate": 0, "recommendedScaffold": "advanced_stretch", "averageResponseTimeMs": 6531}
ses-1792796802215-x2bb	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796795746	Cyber notes	2026-10-23 23:06:42.215+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792797063162-fsvg	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797055881	Cyber notes	2026-10-23 23:11:03.162+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792843601318-wka0	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792843476902	HCI NOTES (1)	2026-10-24 12:06:41.318+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792796573343-121e	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796188801	Cyber notes	2026-10-23 23:02:53.344+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792796633020-69p1	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792796627264	Cyber notes	2026-10-23 23:03:53.021+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792797258570-l29k	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797253686	Cyber notes	2026-10-23 23:14:18.57+00	\N	in_progress	0	introductory	14701	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792797253686-0", "attemptsCount": 1, "responseTimeMs": 14701, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}]	[]	\N
ses-1792843610315-blbz	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792797310135	Cyber notes	2026-10-24 12:06:50.315+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792875560974-l2zn	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792875192806	Cyber notes	2026-10-24 20:59:20.974+00	\N	in_progress	0	introductory	0	[]	[]	\N
ses-1792876338814-59nz	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792876330585	Cyber notes	2026-10-24 21:12:18.814+00	\N	in_progress	0	introductory	7025	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792876330585-0", "attemptsCount": 1, "responseTimeMs": 7025, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 2}]	[]	\N
ses-1792877260601-fl2v	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877254590	Cyber notes	2026-10-24 21:27:40.601+00	\N	in_progress	0	introductory	20503	[{"hintUsed": false, "isCorrect": true, "questionId": "q-1792877254590-0", "attemptsCount": 1, "responseTimeMs": 20503, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 14, "selectedOptionIndex": 0}]	[]	\N
ses-1792946332801-c484	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	lesedimagakwe9@gmail.com	Lesedi Magakwe	module-1792877153867	Cyber notes	2026-10-25 16:38:52.801+00	\N	in_progress	0	introductory	26536	[{"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-0", "attemptsCount": 1, "responseTimeMs": 9661, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 0}, {"hintUsed": false, "isCorrect": true, "confidence": 3, "questionId": "q-1792877153867-1", "attemptsCount": 1, "responseTimeMs": 16875, "hesitationCount": 0, "adaptationAction": "Accelerate instructional pathway to advanced analytical concepts.", "cognitiveLoadScore": 8, "selectedOptionIndex": 2}]	[]	\N
\.


--
-- Data for Name: telemetry_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."telemetry_events" ("id", "user_id", "session_id", "module_id", "question_id", "event_type", "details", "time_spent_ms", "cognitive_load_estimate", "timestamp") FROM stdin;
evt-1792672595898	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672595898-6co0	mod-cog-101	\N	session_start	Student commenced adaptive module: Cognitive Computing & Dynamic Scaffolding	0	\N	2026-10-22 12:36:35.898+00
evt-1792672648012	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	\N	session_start	Student commenced adaptive module: Algorithmic Complexity & Graph Optimization	0	\N	2026-10-22 12:37:28.012+00
evt-1792672662557	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-1	choice_selected	Selected Option 1	14545	\N	2026-10-22 12:37:42.557+00
evt-1792672664310	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-1	answer_submitted	Answered INCORRECTLY. CLI: 35/100, Latency: 16.3s	16297	35	2026-10-22 12:37:44.31+00
evt-1792672678259	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-2	choice_selected	Selected Option 2	9795	\N	2026-10-22 12:37:58.259+00
evt-1792672681306	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-2	answer_submitted	Answered INCORRECTLY. CLI: 38/100, Latency: 12.8s	12842	38	2026-10-22 12:38:01.306+00
evt-1792672686177	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-3	choice_selected	Selected Option 4	1787	\N	2026-10-22 12:38:06.177+00
evt-1792672687558	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	q-algo-3	answer_submitted	Answered INCORRECTLY. CLI: 56/100, Latency: 3.2s	3167	56	2026-10-22 12:38:07.558+00
evt-1792672690576	06856eaf-7042-4adf-ba42-1b9977071735	ses-1792672648012-p37u	mod-algo-202	\N	session_completed	Adaptive session concluded. Overall CLI: 43, Accuracy: 0%	32306	43	2026-10-22 12:38:10.576+00
evt-1792757068690	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	\N	session_start	Student commenced adaptive module: OPERATING SYSTEMS 700 STUDY GUIDE at introductory difficulty.	0	\N	2026-10-23 12:04:28.69+00
evt-1792757077683	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057001-0	choice_selected	Selected Option 1	8994	\N	2026-10-23 12:04:37.683+00
evt-1792757084189	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057001-0	answer_submitted	Answered INCORRECTLY. CLI: 33/100, Latency: 15.5s	15498	33	2026-10-23 12:04:44.189+00
evt-1792757130548	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-1	choice_selected	Selected Option 2	42955	\N	2026-10-23 12:05:30.548+00
evt-1792757133880	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-1	answer_submitted	Answered CORRECTLY. CLI: 28/100, Latency: 46.3s	46286	28	2026-10-23 12:05:33.88+00
evt-1792757143068	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-2	choice_selected	Selected Option 2	6833	\N	2026-10-23 12:05:43.068+00
evt-1792757145248	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-2	answer_submitted	Answered CORRECTLY. CLI: 19/100, Latency: 9.0s	9012	19	2026-10-23 12:05:45.248+00
evt-1792757162156	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-4	choice_selected	Selected Option 3	15122	\N	2026-10-23 12:06:02.156+00
evt-1792757166295	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-4	answer_submitted	Answered INCORRECTLY. CLI: 39/100, Latency: 19.3s	19260	39	2026-10-23 12:06:06.295+00
evt-1792757180790	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-5	hint_requested	Student manually accessed constructivist scaffolding hint.	11889	\N	2026-10-23 12:06:20.79+00
evt-1792757187436	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-5	choice_selected	Selected Option 2	18535	\N	2026-10-23 12:06:27.436+00
evt-1792757190367	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	gen-q-1792757057002-5	answer_submitted	Answered INCORRECTLY. CLI: 40/100, Latency: 21.5s	21465	40	2026-10-23 12:06:30.368+00
evt-1792757193801	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792757068689-zd4q	custom-1792757057002	\N	session_completed	Adaptive session concluded. Overall CLI: 32, Accuracy: 40%	111521	32	2026-10-23 12:06:33.801+00
evt-1792758439255	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792758439255-w14n	custom-1792758430953	\N	session_start	Commenced OPERATING SYSTEMS 700 STUDY GUIDE	0	\N	2026-10-23 12:27:19.255+00
evt-1792772383193	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792772383193-gsok	ai-module-1792772319512	\N	session_start	Commenced HCI NOTES (1)	0	\N	2026-10-23 16:19:43.193+00
evt-1792791281873	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792791281873-6poy	custom-1792758430953	\N	session_start	Commenced OPERATING SYSTEMS 700 STUDY GUIDE	0	\N	2026-10-23 21:34:41.873+00
evt-1792792422456	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792792422456-0aub	module-1792792409202	\N	session_start	Commenced HCI NOTES (1)	0	\N	2026-10-23 21:53:42.456+00
evt-1792792514985	bfbb1948-73c2-40da-9bd5-1cbc80aa8b37	ses-1792792514985-52sv	module-1792792502196	\N	session_start	Commenced OPERATING SYSTEMS 700 STUDY GUIDE	0	\N	2026-10-23 21:55:14.985+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type", "versioning_status", "lifecycle_configuration", "lifecycle_configuration_generation") FROM stdin;
documents	documents	\N	2026-10-21 17:36:46.74066+00	2026-10-21 17:36:46.74066+00	t	f	\N	\N	\N	STANDARD	DISABLED	\N	\N
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "archived_at", "is_delete_marker", "is_versioned") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 37, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict pd4TLP8MQ7oep7KMJkSTA4gM82v8tPba9SGbfaD0gUe4FBflyldpBAG54uR7DSj

RESET ALL;
