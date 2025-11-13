// src/pages/Feedback.jsx
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAxios from '../hooks/useAxios';
import { useAuth } from '../context/AuthContext';

const MAX_COMMENT_LENGTH = 500;

const Feedback = () => {
  const { user } = useAuth();
  const { post } = useAxios();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const remainingChars = useMemo(
    () => MAX_COMMENT_LENGTH - comment.length,
    [comment.length]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    setSubmitting(true);
    try {
      await post('/api/reviews', {
        rating,
        comment: comment.trim(),
      });
      toast.success('Thanks for your feedback!');
      setComment('');
      setRating(5);
      setHoverRating(null);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (index) => {
    const isActive = (hoverRating ?? rating) >= index;
    const Icon = isActive ? FaStar : FaRegStar;
    return (
      <button
        key={index}
        type="button"
        className="text-2xl sm:text-3xl focus:outline-none transition-transform hover:scale-110"
        onMouseEnter={() => setHoverRating(index)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => setRating(index)}
        aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
      >
        <Icon className={isActive ? 'text-yellow-400 drop-shadow' : 'text-gray-500'} />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] py-6 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Share Your Experience
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            We value every bit of feedback. Help us make Healers an even better place for everyone.
          </p>
        </header>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-[#181818] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Overall rating</h2>
            <p className="text-sm text-gray-400">
              How would you rate your recent experience with Healers?
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[1, 2, 3, 4, 5].map(renderStar)}
              <span className="text-gray-400 text-sm">
                {hoverRating ?? rating}/5
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="comment"
              className="text-sm font-semibold text-gray-300 uppercase tracking-wide"
            >
              Tell us more
            </label>
            <textarea
              id="comment"
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              rows={5}
              placeholder="Share your thoughts, feature requests, or what you'd love to see next..."
              className="w-full bg-[#1b1b1b] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1db954] transition"
            />
            <div className="text-xs text-gray-500 text-right">
              {remainingChars} characters remaining
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={submitting || submitted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full px-5 py-3 rounded-full bg-white text-black font-semibold text-sm sm:text-base hover:bg-gray-200 transition disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : submitted ? 'Feedback received' : 'Submit review'}
          </motion.button>
        </motion.form>

        <section className="bg-[#181818] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <h2 className="text-xl font-semibold text-white text-center">
            What happens after you submit?
          </h2>
          <p className="text-sm text-gray-400 text-center leading-relaxed">
            Your review is shared directly with the Healers admin team. They will use your feedback to improve the experience for everyone.
          </p>
          {submitted && (
            <div className="text-center text-sm text-[#1db954] font-semibold">
              Thanks again! Our team has received your thoughts 💚
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
};

export default Feedback;


