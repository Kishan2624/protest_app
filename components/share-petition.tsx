"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
} from 'react-share'
import { Copy } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SharePetitionProps {
  stats: {
    totalSignatures: number
    verifiedSignatures: number
  }
}

export function SharePetition({ stats }: SharePetitionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const title = `Join ${stats.totalSignatures.toLocaleString()} students demanding AICTE approval for DSEU diplomas! #DSEUStudentVoice`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share Petition</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share petition</DialogTitle>
          <DialogDescription>
            Help spread the word by sharing this petition on social media
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid grid-cols-4 gap-4 w-full place-items-center">
            <FacebookShareButton url={shareUrl} hashtag="#DSEUStudentVoice">
              <FacebookIcon size={40} round />
            </FacebookShareButton>
            
            <TwitterShareButton url={shareUrl} title={title}>
              <TwitterIcon size={40} round />
            </TwitterShareButton>
            
            <WhatsappShareButton url={shareUrl} title={title}>
              <WhatsappIcon size={40} round />
            </WhatsappShareButton>
            
            <LinkedinShareButton url={shareUrl} title={title}>
              <LinkedinIcon size={40} round />
            </LinkedinShareButton>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
            onClick={copyLink}
          >
            <span className="truncate">{shareUrl}</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}