import type { Lead, LeadStatus, ListLeadsResponse } from '@broccoli/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchLeads(params?: {
  status?: LeadStatus;
  limit?: number;
  offset?: number;
}): Promise<ListLeadsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set('status', params.status);
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.offset) {
    searchParams.set('offset', params.offset.toString());
  }

  const url = `${API_BASE}/leads${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchLead(id: string): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lead: ${response.statusText}`);
  }

  return response.json();
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update lead status: ${response.statusText}`);
  }

  return response.json();
}
