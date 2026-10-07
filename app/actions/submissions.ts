'use server'

import { db } from '@/lib/db'
import { artistSubmissions, fanCafeSubmissions, suggestions } from '@/lib/db/schema'

export type FormState = { status: 'idle' | 'success' | 'error'; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function field(formData: FormData, name: string, max = 500) {
  const value = formData.get(name)
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function submitSuggestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, 'name', 100)
  const email = field(formData, 'email', 200)
  const socialMedia = field(formData, 'socialMedia', 300)
  const topic = field(formData, 'topic', 50)
  const message = field(formData, 'message', 3000)

  if (!topic || !message) return { status: 'error', message: 'Please choose a topic and write a message.' }
  if (email && !EMAIL_RE.test(email)) return { status: 'error', message: 'Please enter a valid email address.' }

  try {
    await db.insert(suggestions).values({ name: name || null, email: email || null, socialMedia: socialMedia || null, topic, message })
    return { status: 'success', message: 'Thanks! Your suggestion has been sent.' }
  } catch {
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function submitArtistCatalogue(_prev: FormState, formData: FormData): Promise<FormState> {
  const submissionType = field(formData, 'submissionType', 20)
  const artistName = field(formData, 'artistName', 100)
  const instagram = field(formData, 'instagram', 100).replace(/^@/, '')
  const eventName = field(formData, 'eventName', 150)
  const booth = field(formData, 'booth', 30)
  const uploadedValue = formData.get('catalogueFile')
  const catalogueFile = uploadedValue instanceof File && uploadedValue.size > 0 ? uploadedValue : null
  const fandoms = field(formData, 'fandoms', 500)
  const merchTypes = field(formData, 'merchTypes', 500)
  const catalogueUrl = field(formData, 'catalogueUrl', 500)
  const notes = field(formData, 'notes', 2000)

  if (!['new', 'update', 'stamp-rally'].includes(submissionType)) {
    return { status: 'error', message: 'Please choose whether this is a new catalogue, an update, or a stamp rally.' }
  }
  if (!artistName || !instagram || !eventName || !booth) {
    return { status: 'error', message: 'Artist name, Instagram handle, event, and booth number are required.' }
  }
  if (catalogueFile) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(catalogueFile.type)) {
      return { status: 'error', message: 'Upload a PDF, JPG, PNG, or WebP catalogue file.' }
    }
    if (catalogueFile.size > 15 * 1024 * 1024) {
      return { status: 'error', message: 'The catalogue file must be 15 MB or smaller.' }
    }
  }
  if (catalogueUrl) {
    try {
      const url = new URL(catalogueUrl)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch {
      return { status: 'error', message: 'Catalogue link must be a valid http(s) URL.' }
    }
  }

  let catalogueFilePath: string | null = null
  if (catalogueFile) {
    try {
      catalogueFilePath = await uploadCatalogueSubmission(catalogueFile)
    } catch {
      return { status: 'error', message: 'File upload is not configured or failed. Please try again, or submit a catalogue link.' }
    }
  }

  try {
    await db.insert(artistSubmissions).values({
      submissionType,
      artistName,
      instagram,
      eventName,
      booth,
      fandoms: fandoms || null,
      merchTypes: merchTypes || null,
      catalogueUrl: catalogueUrl || null,
      catalogueFilePath,
      notes: notes || null,
    })
    return { status: 'success', message: "Thanks! We'll review your catalogue and add it to the archive soon." }
  } catch {
    if (catalogueFilePath) await removeCatalogueSubmission(catalogueFilePath)
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

function storageConfig() {
  const projectUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'catalogue-submissions'
  if (!projectUrl || !serviceKey) throw new Error('Storage is not configured')
  return { projectUrl: projectUrl.replace(/\/$/, ''), serviceKey, bucket }
}

function storageObjectUrl(projectUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/')
  return `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`
}

async function uploadCatalogueSubmission(file: File) {
  const { projectUrl, serviceKey, bucket } = storageConfig()
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^\.+/, '').slice(-120) || 'catalogue'
  const objectPath = `artist-submissions/${crypto.randomUUID()}/${safeName}`
  const response = await fetch(storageObjectUrl(projectUrl, bucket, objectPath), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'content-type': file.type,
      'x-upsert': 'false',
    },
    body: await file.arrayBuffer(),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Storage upload failed')
  return objectPath
}

async function removeCatalogueSubmission(objectPath: string) {
  try {
    const { projectUrl, serviceKey, bucket } = storageConfig()
    await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
      cache: 'no-store',
    })
  } catch {
    // Retain the original form error if cleanup is unavailable.
  }
}

export async function submitFanCafe(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, 'name', 150)
  const location = field(formData, 'location', 200)
  const startDate = field(formData, 'startDate', 10)
  const endDate = field(formData, 'endDate', 10)
  const socialPlatform = field(formData, 'socialPlatform', 30)
  const socialAccount = field(formData, 'socialAccount', 300)
  const fandom = field(formData, 'fandom', 150)
  const notes = field(formData, 'notes', 2000)
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
  }

  if (!name || !location || !startDate || !socialPlatform || !socialAccount || !fandom) {
    return { status: 'error', message: 'Please fill in all required fields.' }
  }
  if (!validDate(startDate) || (endDate && !validDate(endDate))) {
    return { status: 'error', message: 'Please enter a valid event date.' }
  }
  if (endDate && endDate < startDate) {
    return { status: 'error', message: 'The end date must be on or after the start date.' }
  }
  if (!['Instagram', 'TikTok', 'X', 'Facebook', 'Other'].includes(socialPlatform)) {
    return { status: 'error', message: 'Please choose a valid social platform.' }
  }

  try {
    await db.insert(fanCafeSubmissions).values({
      name,
      location,
      startDate,
      endDate: endDate || null,
      socialPlatform,
      socialAccount,
      fandom,
      notes: notes || null,
    })
    return { status: 'success', message: 'Thanks! Your fan cafe submission is in the review queue.' }
  } catch {
    return { status: 'error', message: 'We could not save your submission. Please try again later.' }
  }
}
