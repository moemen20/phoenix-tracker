import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  User
} from 'lucide-react';
import {
  getProspects,
  addProspect,
  updateProspect,
  deleteProspect,
  subscribeToProspects,
  getTeamUsers
} from '../services/firestore';

const statusColors = {
  nouveau: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacté: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intéressé: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  inscrit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  perdu: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusLabels = {
  nouveau: 'Nouveau',
  contacté: 'Contacté',
  intéressé: 'Intéressé',
  inscrit: 'Inscrit',
  perdu: 'Perdu'
};

export default function Prospects() {
  const { teamId, userRole, userType, personalTeamId } = useAuth();
  console.log('Prospects page - teamId:', teamId, 'userType:', userType, 'personalTeamId:', personalTeamId);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'nouveau',
    notes: '',
    nextFollowUp: '',
    assignedTo: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (!teamId) return;

    const unsubscribe = subscribeToProspects(teamId, (prospectsData) => {
      setProspects(prospectsData);
      setLoading(false);
    }, { search: searchTerm, status: statusFilter });

    return unsubscribe;
  }, [teamId, searchTerm, statusFilter]);

  useEffect(() => {
    if (!teamId || userRole !== 'admin') return;

    const fetchTeamMembers = async () => {
      try {
        const members = await getTeamUsers(teamId);
        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [teamId, userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form with teamId:', teamId);
    console.log('Form data:', formData);

    try {
      if (editingProspect) {
        await updateProspect(editingProspect.id, {
          ...formData,
          assignedTo: editingProspect.assignedTo,
          teamId
        });
      } else {
        await addProspect({
          ...formData,
          assignedTo: null, // For now, no assignment
          teamId
        });
      }
      console.log('Prospect saved successfully');
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving prospect:', error);
      // Don't close modal on error so user can see the issue
    }
  };

  const handleEdit = (prospect) => {
    setEditingProspect(prospect);
    setFormData({
      name: prospect.name || '',
      phone: prospect.phone || '',
      email: prospect.email || '',
      status: prospect.status || 'nouveau',
      notes: prospect.notes || '',
      nextFollowUp: prospect.nextFollowUp ? prospect.nextFollowUp.split('T')[0] : '',
      assignedTo: prospect.assignedTo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this prospect?')) {
      try {
        await deleteProspect(id);
      } catch (error) {
        console.error('Error deleting prospect:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      status: 'nouveau',
      notes: '',
      nextFollowUp: '',
      assignedTo: ''
    });
    setEditingProspect(null);
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchTerm ||
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || prospect.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prospects</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage your network marketing prospects
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-phoenix-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Prospect
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="nouveau">Nouveau</option>
            <option value="contacté">Contacté</option>
            <option value="intéressé">Intéressé</option>
            <option value="inscrit">Inscrit</option>
            <option value="perdu">Perdu</option>
          </select>
        </div>
      </div>

      {/* Prospects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProspects.map((prospect) => (
          <motion.div
            key={prospect.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{prospect.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[prospect.status]}`}>
                  {statusLabels[prospect.status]}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {prospect.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4 mr-2" />
                    {prospect.phone}
                  </div>
                )}
                {prospect.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="h-4 w-4 mr-2" />
                    {prospect.email}
                  </div>
                )}
                {prospect.nextFollowUp && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(prospect.nextFollowUp).toLocaleDateString()}
                  </div>
                )}
              </div>

              {prospect.notes && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{prospect.notes}</p>
              )}

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(prospect)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(prospect.id)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-200 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProspects.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No prospects</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first prospect.
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 opacity-75" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-[60] inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white dark:bg-gray-800 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {editingProspect ? 'Edit Prospect' : 'Add New Prospect'}
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </label>
                          <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="nouveau">Nouveau</option>
                            <option value="contacté">Contacté</option>
                            <option value="intéressé">Intéressé</option>
                            <option value="inscrit">Inscrit</option>
                            <option value="perdu">Perdu</option>
                          </select>
                        </div>

                        {userRole === 'admin' && (
                          <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Assigned To
                            </label>
                            <select
                              id="assignedTo"
                              value={formData.assignedTo}
                              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="">Unassigned</option>
                              {teamMembers.map(member => (
                                <option key={member.uid} value={member.uid}>
                                  {member.name} ({member.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label htmlFor="nextFollowUp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Next Follow-up
                          </label>
                          <input
                            type="date"
                            id="nextFollowUp"
                            value={formData.nextFollowUp}
                            onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Notes
                          </label>
                          <textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-phoenix-orange text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingProspect ? 'Update' : 'Add'} Prospect
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}