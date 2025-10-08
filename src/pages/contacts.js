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
  User,
  MapPin,
  Briefcase
} from 'lucide-react';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  subscribeToContacts
} from '../services/firestore';

export default function Contacts() {
  const { teamId } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    age: '',
    phone: '',
    email: '',
    job: '',
    jobOther: '',
    state: ''
  });

  useEffect(() => {
    if (!teamId) return;

    const unsubscribe = subscribeToContacts(teamId, (contactsData) => {
      setContacts(contactsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting contact form with teamId:', teamId);
    console.log('Form data:', formData);

    try {
      if (editingContact) {
        await updateContact(editingContact.id, {
          ...formData,
          teamId
        });
      } else {
        await addContact({
          ...formData,
          teamId
        });
      }
      console.log('Contact saved successfully');
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      surname: contact.surname || '',
      age: contact.age || '',
      phone: contact.phone || '',
      email: contact.email || '',
      job: contact.job || '',
      jobOther: contact.jobOther || '',
      state: contact.state || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      surname: '',
      age: '',
      phone: '',
      email: '',
      job: '',
      jobOther: '',
      state: ''
    });
    setEditingContact(null);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !stateFilter || contact.state === stateFilter;
    const matchesJob = !jobFilter || contact.job === jobFilter;
    return matchesSearch && matchesState && matchesJob;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage your personal contacts database
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
          Add Contact
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
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="md:w-48">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm"
          >
            <option value="">All States</option>
            <option value="tunis">Tunis</option>
            <option value="ariana">Ariana</option>
            <option value="ben_arous">Ben Arous</option>
            <option value="manouba">Manouba</option>
            <option value="nabeul">Nabeul</option>
            <option value="zaghouan">Zaghouan</option>
            <option value="bizerte">Bizerte</option>
            <option value="beja">Béja</option>
            <option value="jendouba">Jendouba</option>
            <option value="kef">Kef</option>
            <option value="siliana">Siliana</option>
            <option value="sousse">Sousse</option>
            <option value="monastir">Monastir</option>
            <option value="mahdia">Mahdia</option>
            <option value="sfax">Sfax</option>
            <option value="kairouan">Kairouan</option>
            <option value="kasserine">Kasserine</option>
            <option value="sidi_bouzid">Sidi Bouzid</option>
            <option value="gabes">Gabès</option>
            <option value="medenine">Medenine</option>
            <option value="tataouine">Tataouine</option>
            <option value="gafsa">Gafsa</option>
            <option value="tozeur">Tozeur</option>
            <option value="kebili">Kébili</option>
          </select>
        </div>
        <div className="md:w-48">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm"
          >
            <option value="">All Jobs</option>
            <option value="engineer">Engineer</option>
            <option value="teacher">Teacher</option>
            <option value="doctor">Doctor</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Age
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Job
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  State
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContacts.map((contact) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {contact.name} {contact.surname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contact.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contact.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contact.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contact.job === 'other' ? (contact.jobOther || 'Other') : (contact.job || '-')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {contact.state ? contact.state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-phoenix-orange hover:text-orange-700 dark:text-phoenix-orange dark:hover:text-orange-400"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No contacts</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first contact.
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
                        {editingContact ? 'Edit Contact' : 'Add New Contact'}
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Surname *
                            </label>
                            <input
                              type="text"
                              id="surname"
                              required
                              value={formData.surname}
                              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Age
                            </label>
                            <input
                              type="number"
                              id="age"
                              value={formData.age}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="job" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Job
                            </label>
                            <select
                              id="job"
                              value={formData.job}
                              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Job</option>
                              <option value="engineer">Engineer</option>
                              <option value="teacher">Teacher</option>
                              <option value="doctor">Doctor</option>
                              <option value="business">Business</option>
                              <option value="student">Student</option>
                              <option value="other">Other</option>
                            </select>
                            {formData.job === 'other' && (
                              <input
                                type="text"
                                placeholder="Specify job title"
                                value={formData.jobOther}
                                onChange={(e) => setFormData({ ...formData, jobOther: e.target.value })}
                                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            )}
                          </div>

                          <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              State (Tunisia)
                            </label>
                            <select
                              id="state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="">Select State</option>
                              <option value="tunis">Tunis</option>
                              <option value="ariana">Ariana</option>
                              <option value="ben_arous">Ben Arous</option>
                              <option value="manouba">Manouba</option>
                              <option value="nabeul">Nabeul</option>
                              <option value="zaghouan">Zaghouan</option>
                              <option value="bizerte">Bizerte</option>
                              <option value="beja">Béja</option>
                              <option value="jendouba">Jendouba</option>
                              <option value="kef">Kef</option>
                              <option value="siliana">Siliana</option>
                              <option value="sousse">Sousse</option>
                              <option value="monastir">Monastir</option>
                              <option value="mahdia">Mahdia</option>
                              <option value="sfax">Sfax</option>
                              <option value="kairouan">Kairouan</option>
                              <option value="kasserine">Kasserine</option>
                              <option value="sidi_bouzid">Sidi Bouzid</option>
                              <option value="gabes">Gabès</option>
                              <option value="medenine">Medenine</option>
                              <option value="tataouine">Tataouine</option>
                              <option value="gafsa">Gafsa</option>
                              <option value="tozeur">Tozeur</option>
                              <option value="kebili">Kébili</option>
                            </select>
                          </div>
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
                    {editingContact ? 'Update' : 'Add'} Contact
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