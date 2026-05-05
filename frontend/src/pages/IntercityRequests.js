import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import intercityRequestService from '../services/intercityRequestService';
import routeService from '../services/routeService';
import api from '../utils/api';
import './IntercityRequests.css';

const formatCurrency = (value) => `BDT ${Number(value || 0).toLocaleString()}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

const buildEstimate = (offer) => {
  const baseRate = Number(offer.price || 0);
  const serviceFee = Math.round(baseRate * 0.08);
  const total = baseRate + serviceFee;
  return {
    days: 1,
    baseRate,
    driverFee: 0,
    serviceFee,
    multiDayDiscount: 0,
    total,
    advanceAmount: Math.round(total * 0.3),
  };
};

const IntercityRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [routePackages, setRoutePackages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [offerDrafts, setOfferDrafts] = useState({});
  const [messageDrafts, setMessageDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const isVendor = user?.role === 'vendor';

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = isVendor
        ? await intercityRequestService.getVendorRequests()
        : await intercityRequestService.getMyRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to load intercity requests');
    } finally {
      setLoading(false);
    }
  }, [isVendor]);

  const loadVendorTools = useCallback(async () => {
    if (!isVendor) return;
    try {
      const [packageData, vehicleData] = await Promise.all([
        routeService.getMyRoutePackages(),
        api.get('/vehicles/my'),
      ]);
      setRoutePackages(packageData.packages || []);
      setVehicles(vehicleData.data.vehicles || []);
    } catch (err) {
      setRoutePackages([]);
      setVehicles([]);
    }
  }, [isVendor]);

  useEffect(() => {
    loadRequests();
    loadVendorTools();
  }, [loadRequests, loadVendorTools]);

  const updateOfferDraft = (requestId, field, value) => {
    setOfferDrafts((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [field]: value,
      },
    }));
  };

  const submitOffer = async (requestId) => {
    const draft = offerDrafts[requestId] || {};
    try {
      await intercityRequestService.createOffer(requestId, {
        routePackageId: draft.routePackageId,
        vehicleId: draft.vehicleId,
        price: draft.price,
        message: draft.message,
      });
      setOfferDrafts((prev) => ({ ...prev, [requestId]: {} }));
      setNotice('Offer sent to customer');
      loadRequests();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to send offer');
    }
  };

  const sendMessage = async (requestId, vendorId) => {
    const body = messageDrafts[requestId];
    if (!body?.trim()) return;
    try {
      await intercityRequestService.sendMessage(requestId, { body, vendorId });
      setMessageDrafts((prev) => ({ ...prev, [requestId]: '' }));
      loadRequests();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to send message');
    }
  };

  const acceptOffer = async (request, offer) => {
    try {
      const updatedRequest = await intercityRequestService.acceptOffer(request._id, offer._id);
      setRequests((prev) => prev.map((item) => (item._id === updatedRequest._id ? updatedRequest : item)));

      if (offer.vehicle?._id) {
        navigate(`/booking/${offer.vehicle._id}`, {
          state: {
            vehicleId: offer.vehicle._id,
            dates: {
              start: request.startDate?.slice(0, 10),
              end: request.endDate?.slice(0, 10),
            },
            estimate: buildEstimate(offer),
            vehicleName: `${offer.vehicle.make} ${offer.vehicle.model}`,
            withDriver: request.withDriver,
            bookingMode: 'request',
            pickupAddress: `${request.origin}${request.pickupPoint ? ` - ${request.pickupPoint}` : ''}`,
            dropAddress: `${request.destination}${request.dropPoint ? ` - ${request.dropPoint}` : ''}`,
            tripType: 'tourism',
            specialNotes: `Accepted intercity vendor offer. Request ID: ${request._id}`,
            routePackage: offer.routePackage ? {
              id: offer.routePackage._id,
              routeName: offer.routePackage.routeName,
              origin: offer.routePackage.origin,
              destination: offer.routePackage.destination,
              returnTrip: request.returnTrip,
              passengers: request.passengers,
            } : undefined,
          },
        });
      } else {
        setNotice('Offer accepted. Use chat to finalize vehicle details with the vendor.');
      }
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to accept offer');
    }
  };

  const renderMessages = (request) => (
    <div className="ic-chat">
      <h4>Chat</h4>
      <div className="ic-message-list">
        {(request.messages || []).length === 0 ? (
          <p className="ic-muted">No messages yet.</p>
        ) : request.messages.map((message) => (
          <div key={message._id || `${message.createdAt}-${message.body}`} className="ic-message">
            <strong>{message.sender?.name || 'User'}</strong>
            <span>{message.body}</span>
          </div>
        ))}
      </div>
      <div className="ic-chat-input">
        <input
          value={messageDrafts[request._id] || ''}
          onChange={(event) => setMessageDrafts((prev) => ({ ...prev, [request._id]: event.target.value }))}
          placeholder="Type a message..."
        />
        <button type="button" onClick={() => sendMessage(request._id, request.acceptedVendor?._id || request.offers?.[0]?.vendor?._id)}>
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className="ic-page">
      <div className="ic-header">
        <div>
          <h1>{isVendor ? 'Customer Intercity Requests' : 'My Intercity Requests'}</h1>
          <p>{isVendor ? 'Review customer ride details, send package offers, and negotiate.' : 'Compare vendor offers, accept one, and continue to booking.'}</p>
        </div>
        <button type="button" onClick={() => navigate('/route-packages')}>Open route marketplace</button>
      </div>

      {notice && <div className="ic-notice"><span>{notice}</span><button type="button" onClick={() => setNotice('')}>Dismiss</button></div>}

      {loading ? (
        <section className="ic-empty">Loading requests...</section>
      ) : requests.length === 0 ? (
        <section className="ic-empty">
          <h2>No requests yet</h2>
          <p>{isVendor ? 'Customer intercity requests will appear here.' : 'Post your trip details from the route package page to receive vendor offers.'}</p>
        </section>
      ) : (
        <div className="ic-grid">
          {requests.map((request) => (
            <article key={request._id} className="ic-card">
              <div className="ic-card-top">
                <span className={`ic-status ${request.status}`}>{request.status}</span>
                <span>{formatDate(request.startDate)} to {formatDate(request.endDate)}</span>
              </div>
              <h2>{request.origin} to {request.destination}</h2>
              <div className="ic-details">
                <span>{request.passengers} passengers</span>
                <span>{request.withDriver ? 'With driver' : 'Self-drive possible'}</span>
                {request.returnTrip && <span>Return trip</span>}
                {request.vehicleType && <span>{request.vehicleType}</span>}
                {request.budget > 0 && <span>Budget {formatCurrency(request.budget)}</span>}
              </div>
              {request.notes && <p className="ic-notes">{request.notes}</p>}

              {isVendor ? (
                <div className="ic-offer-form">
                  <h3>Send vendor offer</h3>
                  <select value={offerDrafts[request._id]?.routePackageId || ''} onChange={(event) => updateOfferDraft(request._id, 'routePackageId', event.target.value)}>
                    <option value="">Select route package</option>
                    {routePackages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>{pkg.routeName} - {formatCurrency(pkg.priceMin)}</option>
                    ))}
                  </select>
                  <select value={offerDrafts[request._id]?.vehicleId || ''} onChange={(event) => updateOfferDraft(request._id, 'vehicleId', event.target.value)}>
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.specs?.make || vehicle.make} {vehicle.specs?.model || vehicle.model}
                      </option>
                    ))}
                  </select>
                  <input type="number" min="0" value={offerDrafts[request._id]?.price || ''} onChange={(event) => updateOfferDraft(request._id, 'price', event.target.value)} placeholder="Offer price" />
                  <textarea value={offerDrafts[request._id]?.message || ''} onChange={(event) => updateOfferDraft(request._id, 'message', event.target.value)} placeholder="Message or negotiation note" />
                  <button type="button" onClick={() => submitOffer(request._id)}>Send offer</button>
                </div>
              ) : (
                <div className="ic-offers">
                  <h3>Vendor offers</h3>
                  {(request.offers || []).length === 0 ? (
                    <p className="ic-muted">No vendor offers yet.</p>
                  ) : request.offers.map((offer) => (
                    <div key={offer._id} className="ic-offer-card">
                      <div>
                        <strong>{offer.vendor?.vendorDetails?.businessName || offer.vendor?.name || 'Vendor'}</strong>
                        <span>{offer.routePackage?.routeName || 'Custom offer'}</span>
                        {offer.vehicle && <span>{offer.vehicle.make} {offer.vehicle.model}</span>}
                        {offer.message && <p>{offer.message}</p>}
                      </div>
                      <div className="ic-offer-action">
                        <strong>{formatCurrency(offer.price)}</strong>
                        {offer.status === 'accepted' ? (
                          <span className="ic-accepted">Accepted</span>
                        ) : (
                          <button type="button" disabled={request.status === 'accepted'} onClick={() => acceptOffer(request, offer)}>
                            Accept offer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {renderMessages(request)}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntercityRequests;
