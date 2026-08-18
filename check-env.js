#!/usr/bin/env node

import { existsSync } from 'node:fs';
import process from 'node:process';
import dotenv from 'dotenv';

const args = process.argv.slice(2);
const scope = ['dev', 'db', 'production'].includes(args[0]) ? args[0] : 'dev';
const fileFlag = args.indexOf('--file');
const envFile =
	fileFlag >= 0 ? args[fileFlag + 1] : scope === 'production' ? '.env.production' : '.env';

const contracts = {
	dev: [
		'PRIVATE_DATABASE_URL',
		'PUBLIC_SUPABASE_URL',
		'PUBLIC_SUPABASE_ANON_KEY',
		'SUPABASE_SERVICE_ROLE_KEY',
		'BACKEND_URL',
		'JWT_SECRET_KEY'
	],
	db: ['DATABASE_URL'],
	production: [
		'PRIVATE_DATABASE_URL',
		'DATABASE_URL',
		'PUBLIC_SUPABASE_URL',
		'PUBLIC_SUPABASE_ANON_KEY',
		'SUPABASE_SERVICE_ROLE_KEY',
		'BACKEND_URL',
		'JWT_SECRET_KEY',
		'PUBLIC_APP_URL',
		'HOST',
		'PORT',
		'ORIGIN'
	]
};

const optional = [
	'COOKIE_DOMAIN',
	'VITE_SUPABASE_URL',
	'VITE_SUPABASE_ANON_KEY',
	'PUBLIC_APP_NAME',
	'PUBLIC_APP_ENV',
	'PUBLIC_ENABLE_DEBUG_TOOLS',
	'PUBLIC_ENABLE_ANALYTICS',
	'PUBLIC_API_TIMEOUT_MS',
	'PUBLIC_MAX_UPLOAD_SIZE_MB'
];

if (!Object.hasOwn(contracts, scope)) {
	console.error(`Unknown scope "${scope}". Use dev, db, or production.`);
	process.exit(2);
}

if (envFile && existsSync(envFile)) {
	dotenv.config({ path: envFile, override: false });
} else if (envFile) {
	console.warn(`Environment file ${envFile} was not found; checking the process environment only.`);
}

const isPlaceholder = (value) => /(replace|your-|example|change-in-production)/i.test(value || '');

const errors = [];
for (const name of contracts[scope]) {
	const value = process.env[name]?.trim();
	if (!value) {
		errors.push(`${name} is missing`);
		continue;
	}
	if (isPlaceholder(value)) errors.push(`${name} still contains a placeholder`);
}

const databaseNames =
	scope === 'production'
		? ['PRIVATE_DATABASE_URL', 'DATABASE_URL']
		: scope === 'db'
			? ['DATABASE_URL']
			: ['PRIVATE_DATABASE_URL'];
for (const name of databaseNames) {
	const value = process.env[name];
	if (value && !/^postgres(ql)?:\/\//.test(value)) errors.push(`${name} must be a PostgreSQL URL`);
}

if (process.env.JWT_SECRET_KEY && process.env.JWT_SECRET_KEY.length < 32) {
	errors.push('JWT_SECRET_KEY must contain at least 32 characters');
}

if (scope === 'production') {
	for (const name of ['PUBLIC_SUPABASE_URL', 'PUBLIC_APP_URL', 'ORIGIN']) {
		if (process.env[name] && !process.env[name].startsWith('https://')) {
			errors.push(`${name} must use HTTPS in production`);
		}
	}
	if (process.env.PORT && !/^\d+$/.test(process.env.PORT)) errors.push('PORT must be numeric');
}

console.log(`MAP-IT env check: scope=${scope}, source=${envFile || 'process environment'}`);
for (const name of contracts[scope]) {
	console.log(`${process.env[name]?.trim() ? '[set]    ' : '[missing]'} ${name}`);
}
for (const name of optional) {
	if (process.env[name]?.trim()) console.log(`[optional set] ${name}`);
}

if (errors.length > 0) {
	console.error(
		`Environment validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`
	);
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log('Environment validation passed. Values were not printed.');
