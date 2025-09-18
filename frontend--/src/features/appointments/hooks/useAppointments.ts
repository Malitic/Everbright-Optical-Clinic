import { useState, useEffect } from 'react';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, Optometrist } from '../types/appointment.types';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayAppointments,
  getOptometrists,
  getAvailableTimeSlots
} from '../services/appointment.service';

export const useAppointments = (params?: any) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAppointments(params);
      setAppointments(response.data.data || response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [JSON.stringify(params)]);

  const refetch = () => fetchAppointments();

  return { appointments, loading, error, refetch };
};

export const useAppointment = (id: string) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointment = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getAppointment(id);
      setAppointment(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const refetch = () => fetchAppointment();

  return { appointment, loading, error, refetch };
};

export const useCreateAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: CreateAppointmentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createAppointment(data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};

export const useUpdateAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: UpdateAppointmentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateAppointment(id, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};

export const useDeleteAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteAppointment(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};

export const useTodayAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTodayAppointments();
      setAppointments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch today\'s appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const refetch = () => fetchTodayAppointments();

  return { appointments, loading, error, refetch };
};

export const useOptometrists = () => {
  const [optometrists, setOptometrists] = useState<Optometrist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptometrists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOptometrists();
      setOptometrists(response.data.data || response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch optometrists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptometrists();
  }, []);

  const refetch = () => fetchOptometrists();

  return { optometrists, loading, error, refetch };
};

export const useAvailableTimeSlots = (optometristId: number | null, date: string | null) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSlots = async () => {
    if (!optometristId || !date) {
      setTimeSlots([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getAvailableTimeSlots(optometristId.toString(), date);
      setTimeSlots(response.data.available_slots || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch available time slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [optometristId, date]);

  const refetch = () => fetchTimeSlots();

  return { timeSlots, loading, error, refetch };
};
