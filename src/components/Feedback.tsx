import React, { useState } from 'react';
import { Star, MessageSquare, Send, ThumbsUp } from 'lucide-react';

interface FeedbackProps {
  onSubmit: (feedback: { rating: number; comment: string }) => void;
}

export default function Feedback({ onSubmit }: FeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 rounded-lg p-6 text-center">
        <ThumbsUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Thank You!</h3>
        <p className="text-green-700">Your feedback helps us improve the application.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Share Your Feedback
          </h2>
          <p className="text-sm text-gray-500">
            Help us improve Street View Video Maker by sharing your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              How would you rate your experience?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-full"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {rating ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Share your thoughts (optional)
            </label>
            <div className="relative">
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? What could be improved?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors resize-none"
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                {comment.length}/500
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!rating}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
              rating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            <Send className="w-4 h-4" />
            Submit Feedback
          </button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          Your feedback helps us create a better experience for everyone
        </div>
      </div>
    </div>
  );
}