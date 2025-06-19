import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { consultationService } from '../services/consultationService';

function ConsultationChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [newConsultation, setNewConsultation] = useState({
    question: '',
    isAnonymous: false,
    selectedAdminId: ''
  });
  const messagesEndRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      fetchConsultations();
      if (!isAdmin) {
        fetchAdmins();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConsultation) {
      scrollToBottom();
    }
  }, [selectedConsultation?.messages]);

  const fetchAdmins = async () => {
    try {
      const response = await consultationService.getAdmins();
      setAdmins(response);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = isAdmin 
        ? await consultationService.getAllConsultations()
        : await consultationService.getMyConsultations();
      
      // Ensure admin data is populated
      const consultationsWithAdmin = await Promise.all(
        data.map(async (consultation) => {
          if (consultation.admin && !consultation.admin.fullName) {
            try {
              const adminData = await consultationService.getAdminDetails(consultation.admin);
              return {
                ...consultation,
                admin: adminData
              };
            } catch (err) {
              console.error('Error fetching admin details:', err);
              return consultation;
            }
          }
          return consultation;
        })
      );

      setConsultations(consultationsWithAdmin);
      if (selectedConsultation) {
        const updatedConsultation = consultationsWithAdmin.find(c => c._id === selectedConsultation._id);
        if (updatedConsultation) {
          setSelectedConsultation(updatedConsultation);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConsultation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Create message object
    const newMessageObj = {
      content: messageContent,
      isFromUser: !isAdmin,
      timestamp: new Date().toISOString(),
      _id: Date.now().toString()
    };

    // Update local state immediately
    const updatedMessages = [...(selectedConsultation.messages || []), newMessageObj];
    const updatedConsultation = {
      ...selectedConsultation,
      messages: updatedMessages,
      status: !isAdmin && selectedConsultation.status === 'open' ? 'answered' : selectedConsultation.status
    };

    setSelectedConsultation(updatedConsultation);
    setConsultations(prev => prev.map(consultation => 
      consultation._id === selectedConsultation._id
        ? updatedConsultation
        : consultation
    ));

    try {
      // Send message to server
      const response = await consultationService.sendMessage(selectedConsultation._id, {
        content: messageContent,
        isFromUser: !isAdmin
      });

      // Merge admin and user fields if response only contains IDs
      const serverUpdatedConsultation = {
        ...response,
        admin: typeof response.admin === 'object' ? response.admin : selectedConsultation.admin,
        user: typeof response.user === 'object' ? response.user : selectedConsultation.user,
        messages: response.messages || updatedMessages,
      };

      setSelectedConsultation(serverUpdatedConsultation);
      setConsultations(prev => prev.map(consultation => 
        consultation._id === selectedConsultation._id
          ? serverUpdatedConsultation
          : consultation
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      setSelectedConsultation(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m._id !== newMessageObj._id)
      }));
      setConsultations(prev => prev.map(consultation => 
        consultation._id === selectedConsultation._id
          ? {
              ...consultation,
              messages: consultation.messages.filter(m => m._id !== newMessageObj._id)
            }
          : consultation
      ));
    }
  };

  // Add polling for new messages
  useEffect(() => {
    let pollInterval;

    if (isOpen && selectedConsultation) {
      pollInterval = setInterval(async () => {
        try {
          const response = await consultationService.getConsultation(selectedConsultation._id);
          // Merge admin and user fields if response only contains IDs
          const mergedConsultation = {
            ...response,
            admin: typeof response.admin === 'object' ? response.admin : selectedConsultation.admin,
            user: typeof response.user === 'object' ? response.user : selectedConsultation.user,
          };
          if (response.messages.length > selectedConsultation.messages.length) {
            setSelectedConsultation(mergedConsultation);
            setConsultations(prev => prev.map(consultation => 
              consultation._id === selectedConsultation._id
                ? mergedConsultation
                : consultation
            ));
          }
        } catch (err) {
          console.error('Error polling for new messages:', err);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isOpen, selectedConsultation]);

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    if (!newConsultation.question.trim() || (!isAdmin && !newConsultation.selectedAdminId)) return;

    const tempConsultation = {
      _id: Date.now().toString(),
      question: newConsultation.question,
      isAnonymous: newConsultation.isAnonymous,
      status: 'open',
      messages: [{
        content: newConsultation.question,
        isFromUser: true,
        timestamp: new Date().toISOString(),
        _id: Date.now().toString()
      }],
      user: user,
      admin: isAdmin ? null : newConsultation.selectedAdminId,
      createdAt: new Date().toISOString()
    };

    setConsultations(prev => [tempConsultation, ...prev]);
    setSelectedConsultation(tempConsultation);
    setNewConsultation({
      question: '',
      isAnonymous: false,
      selectedAdminId: ''
    });
    setShowNewConsultation(false);

    try {
      const response = await consultationService.createConsultation({
        question: tempConsultation.question,
        isAnonymous: tempConsultation.isAnonymous,
        adminId: tempConsultation.admin
      });

      setConsultations(prev => prev.map(consultation => 
        consultation._id === tempConsultation._id ? response : consultation
      ));
      setSelectedConsultation(response);
    } catch (err) {
      console.error('Error creating consultation:', err);
      setConsultations(prev => prev.filter(c => c._id !== tempConsultation._id));
      setSelectedConsultation(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCloseConsultation = async (consultationId) => {
    try {
      await consultationService.closeConsultation(consultationId);
      setConsultations(prev => prev.map(consultation => 
        consultation._id === consultationId ? { ...consultation, status: 'closed' } : consultation
      ));
      setSelectedConsultation(null);
    } catch (err) {
      console.error('Error closing consultation:', err);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedConsultation
                  ? (isAdmin
                      ? (selectedConsultation.isAnonymous
                          ? 'Anonymous User'
                          : selectedConsultation.user?.fullName)
                      : selectedConsultation.admin?.fullName || 'Loading...')
                  : (isAdmin ? 'Manage Consultations' : 'My Consultations')}
              </h2>
              <div className="flex items-center space-x-4">
                {!isAdmin && (
                  <button
                    onClick={() => setShowNewConsultation(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    New Consultation
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex flex-1 overflow-hidden">
              {/* Consultation List */}
              <div className="w-1/3 border-r overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : consultations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No consultations yet</p>
                    {!isAdmin && (
                      <button
                        onClick={() => setShowNewConsultation(true)}
                        className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Start a new consultation
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {consultations.map((consultation) => (
                      <button
                        key={consultation._id}
                        onClick={() => setSelectedConsultation(consultation)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition duration-150 ${
                          selectedConsultation?._id === consultation._id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {isAdmin
                                ? (consultation.isAnonymous
                                    ? 'Anonymous User'
                                    : consultation.user?.fullName)
                                : consultation.admin?.fullName || 'Loading...'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {consultation.messages?.[consultation.messages.length - 1]?.content || consultation.question}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            consultation.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            consultation.status === 'answered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {consultation.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                {selectedConsultation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {isAdmin 
                              ? (selectedConsultation.isAnonymous 
                                  ? 'Anonymous User' 
                                  : selectedConsultation.user?.fullName)
                              : selectedConsultation.admin?.fullName || 'Loading...'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedConsultation.status === 'open' ? 'Open' :
                             selectedConsultation.status === 'answered' ? 'In Progress' :
                             'Closed'}
                          </p>
                        </div>
                        {selectedConsultation.status !== 'closed' && (
                          <button
                            onClick={() => handleCloseConsultation(selectedConsultation._id)}
                            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Close Consultation
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedConsultation.messages?.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.isFromUser
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.isFromUser ? 'text-indigo-200' : 'text-gray-500'
                            }`}>
                              {formatDate(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    {selectedConsultation.status !== 'closed' && (
                      <form onSubmit={handleSendMessage} className="p-4 border-t">
                        <div className="flex space-x-4">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Type your ${isAdmin ? 'reply' : 'message'}...`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
                          >
                            Send
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    {isAdmin 
                      ? 'Select a consultation to start replying'
                      : 'Select a consultation to start chatting'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Consultation Modal */}
      {showNewConsultation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Consultation</h2>
                <button
                  onClick={() => setShowNewConsultation(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateConsultation} className="space-y-6">
                {!isAdmin && (
                  <div>
                    <label htmlFor="admin" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Counselor
                    </label>
                    <select
                      id="admin"
                      value={newConsultation.selectedAdminId}
                      onChange={(e) => setNewConsultation(prev => ({ ...prev, selectedAdminId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    >
                      <option value="">Select a counselor...</option>
                      {admins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                    onClick={() => setShowNewConsultation(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Start Consultation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ConsultationChat; 