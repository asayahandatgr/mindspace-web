import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { consultationService } from '../services/consultationService';

function Consultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    question: '',
    isAnonymous: false
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationService.getMyConsultations();
      setConsultations(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch consultations. Please try again later.');
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await consultationService.createConsultation(newConsultation);
      setNewConsultation({
        question: '',
        isAnonymous: false
      });
      setShowNewConsultationModal(false);
      fetchConsultations();
    } catch (err) {
      setError('Failed to create consultation. Please try again.');
      console.error('Error creating consultation:', err);
    }
  };

  const handleCloseConsultation = async (id) => {
    if (!window.confirm('Are you sure you want to close this consultation?')) {
      return;
    }
    try {
      await consultationService.closeConsultation(id);
      fetchConsultations();
    } catch (err) {
      setError('Failed to close consultation. Please try again.');
      console.error('Error closing consultation:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Consultations</h1>
        <button
          onClick={() => setShowNewConsultationModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          New Consultation
        </button>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <div key={consultation._id} className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    consultation.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    consultation.status === 'answered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {consultation.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(consultation.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.question}</p>
              </div>
              {consultation.status === 'open' && (
                <button
                  onClick={() => handleCloseConsultation(consultation._id)}
                  className="text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {consultation.answer && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Answer from {consultation.admin?.fullName || 'Admin'}:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Consultation Modal */}
      {showNewConsultationModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Consultation</h2>
                <button
                  onClick={() => setShowNewConsultationModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <textarea
                    id="question"
                    value={newConsultation.question}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, question: e.target.value }))}
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="Type your question here..."
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={newConsultation.isAnonymous}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
                    Post anonymously
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewConsultationModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Submit Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Consultations; 