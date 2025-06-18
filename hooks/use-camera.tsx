"use client"

import { useState, useRef, useCallback } from 'react'

export interface CameraPhoto {
  webPath: string
  format: string
}

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setIsCapturing(true)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      return true
    } catch (error) {
      console.error('Error accessing camera:', error)
      
      // Try with less restrictive constraints if the first attempt fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        })
        
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        return true
      } catch (fallbackError) {
        console.error('Fallback camera access failed:', fallbackError)
        setIsCapturing(false)
        return false
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }, [])

  const takePhoto = useCallback(async (): Promise<CameraPhoto | null> => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera not initialized')
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob and create object URL
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webPath = URL.createObjectURL(blob)
              resolve({
                webPath,
                format: 'jpeg'
              })
            } else {
              resolve(null)
            }
          },
          'image/jpeg',
          0.9
        )
      })
    } catch (error) {
      console.error('Error taking photo:', error)
      return null
    }
  }, [])

  return {
    isCapturing,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    takePhoto
  }
} 