'use server'

import { db } from '@/lib/db'
import { artistSubmissions, fanCafeSubmissions, stampRallySubmissions, suggestions } from '@/lib/db/schema'

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
  const socialMediaHandle = field(formData, 'socialMediaHandle', 300)
  const eventName = field(formData, 'eventName', 150)
  const booth = field(formData, 'booth', 30)
  const uploadedValue = formData.get('catalogueFile')
  const catalogueFile = uploadedValue instanceof File && uploadedValue.size > 0 ? uploadedValue : null
  const fandoms = field(formData, 'fandoms', 500)
  const merchTypes = field(formData, 'merchTypes', 500)
  const catalogueUrl = field(formData, 'catalogueUrl', 500)
  const notes = field(formData, 'notes', 2000)

  if (!['new', 'update', 'pickup-only'].includes(submissionType)) {
    return { status: 'error', message: 'Please choose whether this is a booth catalogue, pick-up catalogue, or update.' }
  }
  if (!artistName || !eventName || !booth) {
    return { status: 'error', message: 'Artist name, event, and booth number are required. Social media handle is optional.' }
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
      socialMediaHandle,
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

async function uploadCatalogueSubmission(file: File, folder = 'artist-submissions') {
  const { projectUrl, serviceKey, bucket } = storageConfig()
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^\.+/, '').slice(-120) || 'catalogue'
  const objectPath = `${folder}/${crypto.randomUUID()}/${safeName}`
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
  const startTime = field(formData, 'startTime', 5)
  const endTime = field(formData, 'endTime', 5)
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
  if ((startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) || (endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime))) {
    return { status: 'error', message: 'Please enter valid start and end times.' }
  }
  if (!['Instagram', 'TikTok', 'X', 'X / Twitter', 'Facebook', 'Other'].includes(socialPlatform)) {
    return { status: 'error', message: 'Please choose a valid social platform.' }
  }

  try {
    await db.insert(fanCafeSubmissions).values({
      name,
      location,
      startDate,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
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

export async function submitStampRally(_prev: FormState, formData: FormData): Promise<FormState> {
  const artistNames = field(formData, 'artistNames', 500)
  const socialMediaHandles = field(formData, 'socialMediaHandles', 500)
  const eventName = field(formData, 'eventName', 150)
  const fandom = field(formData, 'fandom', 200)
  const postLink = field(formData, 'postLink', 500)
  const notes = field(formData, 'notes', 2000)
  const uploadedValue = formData.get('stampRallyFile')
  const stampRallyFile = uploadedValue instanceof File && uploadedValue.size > 0 ? uploadedValue : null

  if (!artistNames || !socialMediaHandles || !eventName || !fandom) {
    return { status: 'error', message: 'Artist names, social media handles, event, and fandom are required.' }
  }
  if (postLink) {
    try {
      const url = new URL(postLink)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch {
      return { status: 'error', message: 'The stamp rally post link must be a valid http(s) URL.' }
    }
  }
  if (stampRallyFile) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(stampRallyFile.type)) {
      return { status: 'error', message: 'Upload a PDF, JPG, PNG, or WebP file.' }
    }
    if (stampRallyFile.size > 15 * 1024 * 1024) {
      return { status: 'error', message: 'The upload must be 15 MB or smaller.' }
    }
  }

  let uploadFilePath: string | null = null
  if (stampRallyFile) {
    try {
      uploadFilePath = await uploadCatalogueSubmission(stampRallyFile, 'stamp-rally-submissions')
    } catch {
      return { status: 'error', message: 'File upload is not configured or failed. Please try again, or submit the post link.' }
    }
  }

  try {
    await db.insert(stampRallySubmissions).values({
      artistNames,
      socialMediaHandles,
      eventName,
      fandom,
      postLink: postLink || null,
      uploadFilePath,
      notes: notes || null,
    })
    return { status: 'success', message: 'Thanks! Your stamp rally submission is in the review queue.' }
  } catch {
    if (uploadFilePath) await removeCatalogueSubmission(uploadFilePath)
    return { status: 'error', message: 'We could not save your submission. Please try again later.' }
  }
}
